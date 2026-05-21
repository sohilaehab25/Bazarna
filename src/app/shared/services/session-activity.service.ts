import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { auditTime, filter, fromEvent, merge } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionActivityService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  private isBrowser = isPlatformBrowser(this.platformId);
  private initialized = false;

  private idleTimeoutMs = 25 * 60 * 1000;
  private warningDurationMs = 60 * 1000;
  private refreshCooldownMs = 5 * 60 * 1000;

  warningOpen = signal(false);
  countdownSeconds = signal(this.getCountdownSeconds());

  private lastRefreshAt = signal(0);
  private idleTimerId: ReturnType<typeof setTimeout> | null = null;
  private warningTimerId: ReturnType<typeof setTimeout> | null = null;
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;

  init(): void {
    if (!this.isBrowser || this.initialized) return;

    this.initialized = true;
    this.registerActivityListeners();

    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      if (!isLoggedIn) {
        this.clearAllTimers();
        this.warningOpen.set(false);
        this.countdownSeconds.set(this.getCountdownSeconds());
        return;
      }

      this.lastRefreshAt.set(Date.now());
      this.resetIdleTimer();
    }, { allowSignalWrites: true });
  }

  recordApiActivity(): void {
    this.init();
    this.recordActivity();
  }

  continueSession(): void {
    if (!this.authService.isLoggedIn()) {
      this.closeWarning();
      return;
    }

    this.closeWarning();

    this.authService.refreshAccessToken().subscribe({
      next: (token) => {
        if (!token && this.authService.shouldLogoutAfterRefreshFailure()) {
          this.forceLogout();
          return;
        }
        this.lastRefreshAt.set(Date.now());
        this.resetIdleTimer();
      },
      error: () => this.forceLogout()
    });
  }

  logoutFromIdle(): void {
    this.forceLogout();
  }

  private registerActivityListeners(): void {
    const doc = this.document;
    const win = doc?.defaultView;

    if (!doc || !win) return;

    const activityEvents$ = merge(
      fromEvent(doc, 'mousemove'),
      fromEvent(doc, 'mousedown'),
      fromEvent(doc, 'keydown'),
      fromEvent(doc, 'scroll', { passive: true }),
      fromEvent(win, 'scroll', { passive: true }),
      fromEvent(win, 'touchstart', { passive: true }),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
    ).pipe(auditTime(500));

    activityEvents$.subscribe(() => this.recordActivity());
  }

  private recordActivity(): void {
    if (!this.isBrowser || !this.authService.isLoggedIn() || this.warningOpen()) return;

    this.resetIdleTimer();
    this.maybeRefreshSession();
  }

  private maybeRefreshSession(): void {
    const now = Date.now();
    if (now - this.lastRefreshAt() < this.refreshCooldownMs) return;

    if (!this.authService.getAccessToken()) return;

    this.lastRefreshAt.set(now);
    this.authService.refreshAccessToken().subscribe({
      next: (token) => {
        if (!token && this.authService.shouldLogoutAfterRefreshFailure()) {
          this.forceLogout();
        }
      },
      error: () => this.forceLogout()
    });
  }

  private resetIdleTimer(): void {
    if (!this.isBrowser || !this.authService.isLoggedIn()) return;

    if (this.idleTimerId) {
      clearTimeout(this.idleTimerId);
    }

    this.idleTimerId = setTimeout(() => this.openWarning(), this.idleTimeoutMs);
  }

  private openWarning(): void {
    if (!this.authService.isLoggedIn() || this.warningOpen()) return;

    this.warningOpen.set(true);
    this.startWarningCountdown();
  }

  private startWarningCountdown(): void {
    this.countdownSeconds.set(this.getCountdownSeconds());

    if (this.warningTimerId) {
      clearTimeout(this.warningTimerId);
    }

    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
    }

    this.warningTimerId = setTimeout(() => this.forceLogout(), this.warningDurationMs);
    this.countdownTimerId = setInterval(() => {
      const nextValue = Math.max(0, this.countdownSeconds() - 1);
      this.countdownSeconds.set(nextValue);
    }, 1000);
  }

  private closeWarning(): void {
    this.warningOpen.set(false);
    this.countdownSeconds.set(this.getCountdownSeconds());
    this.clearWarningTimers();
  }

  private forceLogout(): void {
    this.closeWarning();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private clearWarningTimers(): void {
    if (this.warningTimerId) {
      clearTimeout(this.warningTimerId);
      this.warningTimerId = null;
    }

    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  private clearAllTimers(): void {
    if (this.idleTimerId) {
      clearTimeout(this.idleTimerId);
      this.idleTimerId = null;
    }

    this.clearWarningTimers();
  }

  private getCountdownSeconds(): number {
    return Math.ceil(this.warningDurationMs / 1000);
  }
}
