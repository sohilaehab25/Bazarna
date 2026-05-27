import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'menu', loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'products', loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent) },
  { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
  { path: 'wishlist', loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent) },
  { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'order-success', loadComponent: () => import('./features/order-success/order-success.component').then(m => m.OrderSuccessComponent) },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'edit-profile', loadComponent: () => import('./features/edit-profile/edit-profile.component').then(m => m.EditProfileComponent), canActivate: [authGuard] },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'confirm-signup', loadComponent: () => import('./features/confirm-signup/confirm-signup.component').then(m => m.ConfirmSignupComponent) },
  { path: 'auth/verify-email', loadComponent: () => import('./features/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes) },
  { path: '**', redirectTo: '' }
];
