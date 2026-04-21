import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
}

interface AuthResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        user: User;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3009/api';

    // 🔹 state
    private currentUser = signal<User | null>(null);

    // 🔹 public readonly state
    user$ = this.currentUser.asReadonly();
    isLoggedIn = computed(() => !!this.currentUser());

    constructor(private http: HttpClient) {}

    // =========================
    // 🔐 AUTH METHODS
    // =========================

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
            tap(res => {
                this.setSession(res.data);
            })
        );
    }

    signup(name: string, email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { name, email, password }).pipe(
            tap(res => {
                this.setSession(res.data);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.currentUser.set(null);
    }        
  // =========================
  // 👤 USER PROFILE
  // =========================

    userProfile(): Observable<{ data: { user: User } }> {
        return this.http.get<{ data: { user: User } }>(`${this.apiUrl}/users/profile`).pipe(
            tap(res => {
                console.log("🚀 ~ AuthService ~ userProfile ~ res:", res)
                this.currentUser.set(res.data.user);
            })
        );
    }

    updateProfile(payload: Partial<User>): Observable<{ data: { user: User } }> {
        return this.http.put<{ data: { user: User } }>(`${this.apiUrl}/users/profile`, payload).pipe(
            tap(res => {
                this.currentUser.set(res.data.user);
            })
        );
    }

  // =========================
  // 🔄 SESSION MANAGEMENT
  // =========================

  initUser(): void {
    const token = this.getAccessToken();
    if (!token) return;

    // restore user from backend
    this.userProfile().subscribe({
      error: () => this.logout() // token invalid → cleanup
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