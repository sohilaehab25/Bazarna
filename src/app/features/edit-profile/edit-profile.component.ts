import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-edit-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent],
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private _snackBar = inject(MatSnackBar);

    profileForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]]
    });

    currentUser = this.authService.user$;

    ngOnInit(): void {
        const user = this.currentUser();
        if (user) {
            this.profileForm.patchValue({
                name: user.name,
                email: user.email
            });
        }
    }

    onSubmit(): void {
        if (this.profileForm.valid) {
            const { name, email } = this.profileForm.value;
            this.authService.updateProfile({ name, email }).subscribe({
                next: () => {
                    this._snackBar.open('Profile updated successfully', 'Close', {
                        duration: 3000,
                        panelClass: ['success-snackbar']
                    });
                    this.router.navigate(['/profile']);
                },
                error: (error) => {
                    this._snackBar.open('Failed to update profile', 'Close', {
                        duration: 3000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/profile']);
    }
}