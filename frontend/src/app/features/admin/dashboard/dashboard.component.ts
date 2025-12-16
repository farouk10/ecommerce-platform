import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  stats: AdminStats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
    newUsersThisMonth: 0,
  };

  loading = true;
  today = new Date();
  private readonly STATS_API = `${environment.adminServiceUrl}/stats`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<AdminStats>(this.STATS_API).subscribe({
      next: (data) => {
        this.stats = { ...this.stats, ...data };
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement stats:', error);
        this.loading = false;
      },
    });
  }
}
