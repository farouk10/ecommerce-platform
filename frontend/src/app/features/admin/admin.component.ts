import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AdminNotificationService,
  AdminNotification,
} from '../../core/services/admin-notification.service';
import { CommandPaletteComponent } from './components/command-palette/command-palette.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommandPaletteComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  user$!: Observable<User | null>;
  isSidebarOpen = false;
  isNotificationsOpen = false;

  notifications$: Observable<AdminNotification[]>;
  unreadCount$: Observable<number>;
  activeOrdersCount$: Observable<number>;

  constructor(
    private authService: AuthService,
    private notificationService: AdminNotificationService
  ) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unseenCount$;

    // Derived count for Sidebar Badge
    this.activeOrdersCount$ = this.notifications$.pipe(
      map((list) => list.filter((n) => n.type === 'ORDER').length)
    );
  }

  ngOnInit() {
    this.user$ = this.authService.getUser();
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    // Clear badge when opening
    if (this.isNotificationsOpen) {
      this.notificationService.clearBadge();
    }
  }

  // Click on Notification -> Dismiss (Read)
  markAsRead(id: string) {
    this.notificationService.dismiss(id);
    this.isNotificationsOpen = false; // Close dropdown
  }

  // Mark all -> Dismiss all
  markAllAsRead() {
    this.notificationService.clearAll();
  }

  // Clear all button
  clearAll() {
    this.notificationService.clearAll();
  }

  logout() {
    this.authService.logout();
  }
}
