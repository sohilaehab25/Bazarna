import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-bazaar-icon',
  standalone: true,
  template: `
    <svg [style.width]="size()" [style.height]="size()" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="bazaar-icon">
      <!-- Ground line -->
      <line x1="20" y1="170" x2="180" y2="170" stroke="#542C1E" stroke-width="6" stroke-linecap="round"/>
      
      <!-- Building Main Structure -->
      <rect x="55" y="65" width="90" height="105" fill="#FFF1E1" stroke="#542C1E" stroke-width="4"/>
      
      <!-- Top Cornice/Roof Details -->
      <rect x="50" y="35" width="100" height="15" rx="4" fill="#542C1E"/>
      <rect x="60" y="25" width="80" height="10" fill="#542C1E"/>
      <!-- Vertical details on roof -->
      @for (i of [0,1,2,3,4,5,6,7]; track i) {
        <line [attr.x1]="65 + (i * 10)" y1="25" [attr.x2]="65 + (i * 10)" y2="35" stroke="#FFF1E1" stroke-width="2"/>
      }
      <rect x="45" y="50" width="110" height="15" rx="7" fill="#542C1E"/>

      <!-- Signboard -->
      <rect x="55" y="65" width="90" height="35" fill="#FFF1E1" stroke="#542C1E" stroke-width="4"/>
      <text x="100" y="88" text-anchor="middle" fill="#542C1E" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="16" letter-spacing="1">BAZAAR</text>

      <!-- Awning (Animated Sway) -->
      <g class="awning-group">
        <path d="M55 100 L145 100 L145 110 Q136 120 127 110 Q118 120 109 110 Q100 120 91 110 Q82 120 73 110 Q64 120 55 110 Z" fill="#FCD3C1" stroke="#542C1E" stroke-width="3"/>
      </g>

      <!-- Windows -->
      <!-- Left Window -->
      <rect x="62" y="125" width="22" height="35" fill="#C1F4FF" stroke="#542C1E" stroke-width="3"/>
      <line x1="62" y1="142" x2="84" y2="142" stroke="#542C1E" stroke-width="2"/>
      <line x1="73" y1="125" x2="73" y2="160" stroke="#542C1E" stroke-width="2"/>

      <!-- Right Window -->
      <rect x="116" y="125" width="22" height="35" fill="#C1F4FF" stroke="#542C1E" stroke-width="3"/>
      <line x1="116" y1="142" x2="138" y2="142" stroke="#542C1E" stroke-width="2"/>
      <line x1="127" y1="125" x2="127" y2="160" stroke="#542C1E" stroke-width="2"/>

      <!-- Door -->
      <rect x="91" y="135" width="18" height="35" fill="#FFD6A5" stroke="#542C1E" stroke-width="3"/>

      <!-- Baskets and Fruit (Animated Bounce) -->
      <g class="baskets-group">
        <!-- Basket 1 (Left) -->
        <path d="M35 155 L48 155 L45 170 L38 170 Z" fill="#E8C697" stroke="#542C1E" stroke-width="3"/>
        <circle class="fruit f1" cx="38" cy="152" r="5" fill="#FFB347" stroke="#542C1E" stroke-width="2"/>
        <circle class="fruit f2" cx="45" cy="152" r="5" fill="#98FB98" stroke="#542C1E" stroke-width="2"/>
        <circle class="fruit f3" cx="41" cy="146" r="5" fill="#FFFACD" stroke="#542C1E" stroke-width="2"/>

        <!-- Basket 2 (Middle) -->
        <path d="M48 155 L61 155 L58 170 L51 170 Z" fill="#E8C697" stroke="#542C1E" stroke-width="3"/>
        <circle class="fruit f4" cx="51" cy="152" r="5" fill="#FFB347" stroke="#542C1E" stroke-width="2"/>
        <circle class="fruit f5" cx="58" cy="152" r="5" fill="#98FB98" stroke="#542C1E" stroke-width="2"/>
        <circle class="fruit f6" cx="54" cy="146" r="5" fill="#FFFACD" stroke="#542C1E" stroke-width="2"/>

        <!-- Basket 3 (Right) -->
        <path d="M61 155 L74 155 L71 170 L64 170 Z" fill="#E8C697" stroke="#542C1E" stroke-width="3"/>
        <circle class="fruit f7" cx="64" cy="152" r="5" fill="#FFB347" stroke="#542C1E" stroke-width="2"/>
        <circle class="fruit f8" cx="71" cy="152" r="5" fill="#98FB98" stroke="#542C1E" stroke-width="2"/>
        <circle class="fruit f9" cx="67" cy="146" r="5" fill="#FFFACD" stroke="#542C1E" stroke-width="2"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    .bazaar-icon {
      overflow: visible;
      transform-origin: center bottom;
      animation: entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .awning-group {
      transform-origin: 100px 100px;
      animation: sway 4s ease-in-out infinite;
    }
    .fruit {
      animation: bounce 2s ease-in-out infinite;
    }
    .f1, .f4, .f7 { animation-delay: 0.1s; }
    .f2, .f5, .f8 { animation-delay: 0.4s; }
    .f3, .f6, .f9 { animation-delay: 0.7s; }

    @keyframes entrance {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes sway {
      0%, 100% { transform: rotate(-0.5deg); }
      50% { transform: rotate(0.5deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    :host:hover .bazaar-icon {
      transform: translateY(-5px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BazaarIconComponent {
  size = input<string>('48px');
}
