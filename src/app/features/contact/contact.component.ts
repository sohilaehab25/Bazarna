import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="contact">
      <section class="hero">
        <h1>Contact Us 💌</h1>
        <p>We'd love to hear from you!</p>
      </section>

      <div class="contact-content">
        <div class="contact-info">
          <app-card>
            <h2>Get in Touch</h2>
            <div class="contact-details">
              <div class="contact-item">
                <span class="contact-icon">📧</span>
                <div>
                  <strong>Email</strong><br>
                  hello@cutebazar.com
                </div>
              </div>
              <div class="contact-item">
                <span class="contact-icon">📞</span>
                <div>
                  <strong>Phone</strong><br>
                  +1 (555) 123-BAZAR
                </div>
              </div>
              <div class="contact-item">
                <span class="contact-icon">📍</span>
                <div>
                  <strong>Address</strong><br>
                  123 Artisan Street<br>
                  Craft City, CC 12345
                </div>
              </div>
              <div class="contact-item">
                <span class="contact-icon">🕒</span>
                <div>
                  <strong>Hours</strong><br>
                  Mon-Fri: 9AM-6PM<br>
                  Sat-Sun: 10AM-4PM
                </div>
              </div>
            </div>
          </app-card>
        </div>

        <div class="contact-form">
          <app-card>
            <h2>Send us a Message</h2>
            <form class="message-form">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" placeholder="Your name" class="form-input">
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" placeholder="your@email.com" class="form-input">
              </div>
              <div class="form-group">
                <label for="subject">Subject</label>
                <input type="text" id="subject" placeholder="How can we help?" class="form-input">
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" rows="5" placeholder="Tell us more..." class="form-input"></textarea>
              </div>
              <app-button type="submit">
                Send Message 💌
              </app-button>
            </form>
          </app-card>
        </div>
      </div>

      <section class="faq">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-grid">
          <app-card>
            <h3>How do I track my order?</h3>
            <p>You can track your order status in your profile under Order History.</p>
          </app-card>
          <app-card>
            <h3>Do you offer returns?</h3>
            <p>Yes, we accept returns within 30 days of purchase. Items must be unused and in original packaging.</p>
          </app-card>
          <app-card>
            <h3>How long does shipping take?</h3>
            <p>Most orders ship within 2-3 business days. Delivery typically takes 3-5 business days.</p>
          </app-card>
          <app-card>
            <h3>Can I customize items?</h3>
            <p>Some items can be customized. Contact us for details on specific products.</p>
          </app-card>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {}