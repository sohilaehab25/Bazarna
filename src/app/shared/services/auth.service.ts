import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);

  login(email: string, password: string) {
    // TODO: Implement API call
    // Mock login for now
    if (email && password) {
      this.currentUser.set({
        id: '1',
        name: 'Bazar Lover',
        email: email
      });
    }
  }

  logout() {
    this.currentUser.set(null);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser() !== null;
  }
}