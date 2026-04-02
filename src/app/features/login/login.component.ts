import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoginMode = signal(true);
  errorMessage = signal('');

  authForm: FormGroup = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {
    this._updateFormValidators();
  }

  toggleMode(event: Event) {
    event.preventDefault();
    this.isLoginMode.set(!this.isLoginMode());
    this._updateFormValidators();
    this.authForm.reset();
    this.errorMessage.set('');
  }

  private _updateFormValidators() {
    const nameControl = this.authForm.get('name');
    if (this.isLoginMode()) {
      nameControl?.clearValidators();
    } else {
      nameControl?.setValidators([Validators.required]);
    }
    nameControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.valid) {
      this.errorMessage.set('');
      const { name, email, password } = this.authForm.value;
      if (this.isLoginMode()) {
        this.authService.login(email, password).subscribe({
          next: (response) => {
            console.log("🚀 ~ LoginComponent ~ onSubmit ~ response:", response)
            console.log('Login successful', response);
            this.router.navigate(['/menu']);
          },
          error: (error) => {
            console.error('Login failed', error);
            this.errorMessage.set(error.error?.message || 'Login failed. Please try again.');
          }
        });
      } else {
        this.authService.signup(name, email, password).subscribe({
          next: (response) => {
            console.log('Signup successful', response);
            this.router.navigate(['/confirm-signup']);
          },
          error: (error) => {
            console.error('Signup failed', error);
            this.errorMessage.set(error.error?.message || 'Signup failed. Please try again.');
          }
        });
      }
    }
  }
}