import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data?: T;
}

interface SignupResponse extends ApiResponse<{
    user: { _id: string; email: string; name: string };
}> {}

interface AuthResponse extends ApiResponse<{
    accessToken: string;
    refreshToken: string;
    user: User;
}> {}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3009/api';

      // 🔹 state
    private currentUser = signal<User | null>(null);

    // 🔹 public readonly state
    user$ = this.currentUser.asReadonly();
    isLoggedIn = computed(() => !!this.currentUser());

    // =========================
    // 🔐 AUTH METHODS
    // =========================

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
            tap((res) => {
                if (res.data) this.setSession(res.data);
            })
        );
    }

    signup(name: string, email: string, password: string): Observable<SignupResponse> {
        return this.http.post<SignupResponse>(`${this.apiUrl}/auth/register`, { name, email, password });
    }

    verifyEmail(token: string): Observable<ApiResponse<{ user: User & { isVerified: boolean } }>> {
        return this.http.get<ApiResponse<{ user: User & { isVerified: boolean } }>>(
            `${this.apiUrl}/auth/verify-email?token=${token}`
        );
    }

    resendVerification(email: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.apiUrl}/auth/resend-verification`, { email });
    }

    logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.currentUser.set(null);
    }

    // =========================
    // 👤 USER PROFILE
    // =========================

    userProfile(): Observable<ApiResponse<{ user: User }>> {
        return this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/users/profile`).pipe(
            tap((res) => {
                if (res.data) this.currentUser.set(res.data.user);
            })
        );
    }

    updateProfile(payload: Partial<User>): Observable<ApiResponse<{ user: User }>> {
        return this.http.put<ApiResponse<{ user: User }>>(`${this.apiUrl}/users/profile`, payload).pipe(
            tap((res) => {
                if (res.data) this.currentUser.set(res.data.user);
            })
        );
    }

    // =========================
    // 🔄 SESSION MANAGEMENT
  // =========================

    initUser(): void {
        const token = this.getAccessToken();
        if (!token) return;

            // Restore user from backend; clear session if token is invalid
        this.userProfile().subscribe({
            error: () => this.logout(),
        });
    }

    private setSession(data: { accessToken: string; refreshToken: string; user: User }) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        this.currentUser.set(data.user);
  }

  // =========================
  // 🔑 TOKEN HELPERS
  // =========================

    getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    }
}