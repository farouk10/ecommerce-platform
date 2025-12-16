import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartBadgeComponent } from '../cart-badge/cart-badge.component';
import { User } from '../../../shared/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CartBadgeComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  currentUser$: Observable<User | null>;
  cartCount$: Observable<number>;
  isAuthenticated$: Observable<boolean>;
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;

  @ViewChild('profileMenuContainer') profileMenuContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.cartCount$ = this.cartService.cartCount$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isProfileMenuOpen && this.profileMenuContainer) {
      if (!this.profileMenuContainer.nativeElement.contains(event.target)) {
        this.closeProfileMenu();
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.closeProfileMenu();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }
}
