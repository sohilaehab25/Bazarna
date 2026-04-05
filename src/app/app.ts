import { Component, inject, computed, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { CartService } from './shared/services/cart.service';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = 'Bazarna';

  private authService = inject(AuthService);

  ngOnInit(): void {
    // Restore user session on app startup
    this.authService.initUser();
  }
}
