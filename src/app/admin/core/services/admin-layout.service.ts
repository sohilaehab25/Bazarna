import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminLayoutService {
  private readonly sidebarCollapsedState = signal(false);
  private readonly mobileSidebarOpenState = signal(false);

  readonly sidebarCollapsed = this.sidebarCollapsedState.asReadonly();
  readonly mobileSidebarOpen = this.mobileSidebarOpenState.asReadonly();
  readonly sidebarExpanded = computed(() => !this.sidebarCollapsedState());

  toggleSidebarCollapsed(): void {
    this.sidebarCollapsedState.update((isCollapsed) => !isCollapsed);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpenState.update((isOpen) => !isOpen);
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpenState.set(true);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpenState.set(false);
  }
}
