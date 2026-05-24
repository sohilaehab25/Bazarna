import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SessionWarningComponent } from '../session-warning/session-warning.component';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SessionWarningComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  // Layout wrapper component - handles the main application structure
}