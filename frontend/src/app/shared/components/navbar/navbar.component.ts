import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartBadgeComponent } from '../cart-badge/cart-badge.component';
import { Observable } from 'rxjs';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CartBadgeComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  currentUser$: Observable<User | null>;
  isMobileMenuOpen = false;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('✅ Logout Clicked! Initiating sequence...');

    // Optimistic clear
    this.authService.logout().subscribe();

    // Force redirect with slight delay to ensure event handling is done
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
