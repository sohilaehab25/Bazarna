import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, InputComponent],
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent {
  subscribe(email: string) {
    if (email) {
      alert(`Thank you for subscribing with ${email}! We'll send you updates soon. 📧`);
    }
  }
}