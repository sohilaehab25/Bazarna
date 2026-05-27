import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-unauthorized',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-unauthorized.component.html',
  styleUrl: './admin-unauthorized.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUnauthorizedComponent {}
