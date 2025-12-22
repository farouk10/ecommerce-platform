import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models';

interface User {
  id: string; // Changed from number to string (UUID)
  email: string;
  name: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.component.html', // External template
})
export class UsersAdminComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Sorting
  sortColumn: keyof User = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Loading State
  isLoading = true;

  // Make Math available in template
  protected readonly Math = Math;

  private readonly ADMIN_USERS_API = `${environment.authServiceUrl}/admin/users`;

  // Drawer State
  selectedUser: User | null = null;
  userOrders: any[] = []; // Using any[] temporarily or import Order interface
  isLoadingOrders = false;
  drawerOpen = false;

  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute // Injected
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  // Handle deep linking after users are loaded
  private checkDeepLink() {
    const userId = this.route.snapshot.queryParams['userId'];
    if (userId) {
      const user = this.users.find((u) => u.id === userId);
      if (user) {
        this.selectUser(user);
        // Clear query param to avoid reopening on refresh (optional, but good UX)
        this.router.navigate([], {
          queryParams: { userId: null },
          queryParamsHandling: 'merge',
        });
      }
    }
  }

  viewOrderDetails(orderId: string) {
    this.drawerOpen = false; // Close drawer before navigating
    this.router.navigate(['/admin/orders', orderId]);
  }

  // ... (loadUsers, sort, filter methods remain same)

  selectUser(user: User) {
    this.selectedUser = user;
    this.drawerOpen = true;
    this.isLoadingOrders = true;
    this.userOrders = [];

    this.orderService.getOrdersByUserId(user.id).subscribe({
      next: (orders) => {
        this.userOrders = orders;
        this.isLoadingOrders = false;
      },
      error: (err) => {
        console.error('Error loading user orders', err);
        this.isLoadingOrders = false;
      },
    });
  }

  closeDrawer() {
    this.drawerOpen = false;
    setTimeout(() => {
      this.selectedUser = null;
      this.userOrders = [];
    }, 300); // Wait for animation
  }

  // ... (toggleStatus remains)

  loadUsers() {
    this.isLoading = true;
    this.http.get<User[]>(this.ADMIN_USERS_API).subscribe({
      next: (data) => {
        this.users = data;
        this.applyFiltersAndSort();
        this.isLoading = false;
        this.checkDeepLink(); // Trigger deep link check
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.isLoading = false;
      },
    });
  }

  onSearch() {
    this.currentPage = 1; // Reset to first page on search
    this.applyFiltersAndSort();
  }

  sort(column: keyof User) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let result = [...this.users];

    // 1. Filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          (u.name && u.name.toLowerCase().includes(term)) ||
          u.id.toString().includes(term)
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      const valA = a[this.sortColumn];
      const valB = b[this.sortColumn];

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredUsers = result;
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (
      page >= 1 &&
      page <= Math.ceil(this.filteredUsers.length / this.pageSize)
    ) {
      this.currentPage = page;
    }
  }

  toggleStatus(user: User) {
    const action = user.enabled ? 'désactiver' : 'activer';
    if (!confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
      return;
    }

    this.http
      .patch(`${this.ADMIN_USERS_API}/${user.id}/status`, {
        enabled: !user.enabled,
      })
      .subscribe({
        next: () => {
          // Update local state smoothly
          user.enabled = !user.enabled;
          // Apply filters again in case sort was on enabled status
          this.applyFiltersAndSort();
        },
        error: (err) => {
          console.error('Error updating status', err);
          alert('Erreur lors de la mise à jour du statut.');
        },
      });
  }
}
