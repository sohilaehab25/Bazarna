import { ChangeDetectionStrategy, Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CardComponent, ButtonComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    private platformId = inject(PLATFORM_ID);
    isLoginMode = signal(true);
    errorMessage = signal('');

    authForm = this.fb.group({
        name: [''],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
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
        if (this.authForm.invalid) return;

        this.errorMessage.set('');
        const { name, email, password } = this.authForm.value;

        if (this.isLoginMode()) {
            this.authService.login(email!, password!).subscribe({
                next: (response) => {
                    const userRole = response.data?.user?.role;
                    const isAdmin = typeof userRole === 'string' && userRole.toLowerCase() === 'admin';
                    void this.router.navigateByUrl(isAdmin ? '/admin/dashboard' : '/menu');
                },
                error: (error) => {
                    this.errorMessage.set(error.error?.message || 'Login failed. Please try again.');
                },
            });
        } else {
            this.authService.signup(name!, email!, password!).subscribe({
                next: () => {
                    if (isPlatformBrowser(this.platformId)) {
                        sessionStorage.setItem('pendingVerificationEmail', email!);
                    }
                    this.router.navigate(['/confirm-signup']);
                },
                error: (error) => {
                    this.errorMessage.set(error.error?.message || 'Signup failed. Please try again.');
            },
            });
        }
    }
}