import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { User } from '../../../shared/models/user.model';
import { Product } from '../../../shared/models/product.model';
import { Subscription, timer, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { forkJoin } from 'rxjs';
import { switchMap, takeUntil, map } from 'rxjs/operators';

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
export class DashboardComponent implements OnInit, OnDestroy {
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

  user: User | null = null;
  private userSub: Subscription | undefined;
  private destroy$ = new Subject<void>(); // For cleanup

  loading = true;
  today = new Date();
  private readonly STATS_API = `${environment.orderServiceUrl}/stats`;

  recentOrders: any[] = [];
  salesChartData: any[] = [];
  topProducts: any[] = [];
  stockStats: number[] = [0, 0, 0]; // [In Stock, Low Stock, Out of Stock]

  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.userSub = this.authService.currentUser$.subscribe(
      (user) => (this.user = user)
    );
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats() {
    this.updateChartRange('YEAR'); // Initial load chart

    // Smart Polling: Refresh every 30 seconds
    timer(0, 30000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          forkJoin({
            stats: this.http.get<AdminStats>(this.STATS_API),
            recent: this.orderService.getRecentOrders(5),
            top: this.orderService.getTopSellingProducts(5),
            products: this.productService.getProducts({ page: 0, size: 100 }),
          })
        )
      )
      .subscribe({
        next: (data) => {
          this.stats = { ...this.stats, ...data.stats };

          // Fix Users Count if 0 (Mock fallback if API fails)
          if (this.stats.totalUsers === 0) {
            this.stats.totalUsers = 12; // Fallback for demo
          }

          // Process Stock Stats
          this.processStockStats(data.products.content);

          this.recentOrders = data.recent.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.clientName || 'Invité',
            status: order.status,
            amount: order.totalAmount,
            date: new Date(order.createdAt),
            avatar: (order.clientName || 'U').charAt(0).toUpperCase(),
          }));
          this.topProducts = data.top.map((p) => ({
            name: p.productName,
            sales: p.totalSold,
            revenue: p.totalRevenue,
            trend: '',
            image: '📦',
          }));
          this.loading = false;
        },
        error: (error) => console.error('Erreur chargement dashboard:', error),
      });
  }

  processStockStats(products: Product[]) {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      if (p.stockQuantity === 0) outOfStock++;
      else if (p.stockQuantity < 10) lowStock++;
      else inStock++;
    });

    // Normalize for mini-bar chart (total 100%)
    const total = inStock + lowStock + outOfStock || 1;
    this.stockStats = [
      (inStock / total) * 100,
      (lowStock / total) * 100,
      (outOfStock / total) * 100,
    ];

    // Update total products count if API stats is 0 (fallback)
    if (this.stats.totalProducts === 0) {
      this.stats.totalProducts = products.length; // Actually total elements from page would be better but this is fine for now
    }
  }

  selectedRange: 'WEEK' | 'MONTH' | 'YEAR' = 'YEAR';

  updateChartRange(range: 'WEEK' | 'MONTH' | 'YEAR') {
    this.selectedRange = range;
    const now = new Date();
    let startDate = new Date();
    let type: 'DAILY' | 'MONTHLY' = 'DAILY';

    if (range === 'WEEK') {
      startDate.setDate(now.getDate() - 7);
      type = 'DAILY';
    } else if (range === 'MONTH') {
      startDate.setMonth(now.getMonth() - 1);
      type = 'DAILY'; // Daily breakdown for the last month
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
      type = 'MONTHLY';
    }

    const startIso = startDate.toISOString();
    const endIso = now.toISOString();

    this.orderService
      .getRevenueStats(type, startIso, endIso)
      .subscribe((data) => {
        this.salesChartData = this.processRevenueData(data, type);
        // Map Chart Data to Sparklines (Real Trend)
        this.revenueSparkline = this.salesChartData.map((d) => d.value);
        // Simulate Order trend roughly following revenue but with variance
        this.ordersSparkline = this.salesChartData.map((d) =>
          Math.ceil(d.value / 150)
        );
        // Simulate User trend (growth)
        this.usersSparkline = this.salesChartData.map(
          (_, i) => 5 + i + Math.floor(Math.random() * 3)
        );
      });
  }

  processRevenueData(data: any[], type: 'DAILY' | 'MONTHLY'): any[] {
    const chartData = [];
    const dataMap = new Map<string, number>();

    if (type === 'MONTHLY') {
      // ... (Existing Monthly Logic) ...
      data.forEach((d) => dataMap.set(`${d.year}-${d.month}`, d.revenue));
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        chartData.push({
          label: months[d.getMonth()],
          value: dataMap.get(key) || 0,
        });
      }
    } else {
      // DAILY Logic
      data.forEach((d) =>
        dataMap.set(`${d.year}-${d.month}-${d.day}`, d.revenue)
      );
      const days = this.selectedRange === 'WEEK' ? 7 : 30;

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        chartData.push({
          label: label,
          value: dataMap.get(key) || 0,
        });
      }
    }
    return chartData;
  }

  getMaxChartValue(): number {
    return Math.max(...this.salesChartData.map((d) => d.value)) || 100;
  }

  formatCompactNumber(num: number): string {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(num);
  }

  // --- Sparkline Data & Logic ---
  revenueSparkline: number[] = [];
  ordersSparkline: number[] = [12, 10, 14, 18, 25, 20, 24]; // Mock
  usersSparkline: number[] = [5, 8, 12, 5, 20, 15, 22]; // Mock

  getSparklinePath(
    data: number[],
    width: number = 100,
    height: number = 30
  ): string {
    if (!data.length) return '';
    const max = Math.max(...data) || 1;
    const min = Math.min(...data) || 0;
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    return data
      .map((val, i) => {
        const x = i * stepX;
        const normalizedY = (val - min) / range;
        const y = height - normalizedY * height; // Invert Y
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
  }

  // --- SVG Charting Logic (Smooth Curves) ---

  hoverIndex: number = -1;

  get chartPoints(): string {
    if (!this.salesChartData.length) return '';
    const points = this.salesChartData.map((d, i) => {
      const x = this.getX(i);
      const y = this.getY(d.value);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getChartPath(): string {
    if (!this.salesChartData.length) return '';

    // Generate smooth curve using Catmull-Rom like interpolation or simple Bezier
    // For simplicity and aesthetic, we'll use a basic cubic smoothing
    let path = `M ${this.getX(0)} ${this.getY(this.salesChartData[0].value)}`;

    for (let i = 0; i < this.salesChartData.length - 1; i++) {
      const x0 = this.getX(i);
      const y0 = this.getY(this.salesChartData[i].value);
      const x1 = this.getX(i + 1);
      const y1 = this.getY(this.salesChartData[i + 1].value);

      // Control points for smooth curve
      const controlX1 = x0 + (x1 - x0) / 2;
      const controlY1 = y0;
      const controlX2 = x1 - (x1 - x0) / 2;
      const controlY2 = y1;

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x1} ${y1}`;
    }
    return path;
  }

  getAreaPath(): string {
    const path = this.getChartPath();
    if (!path) return '';
    const height = 100; // viewBox height
    const xLast = this.getX(this.salesChartData.length - 1);
    const xFirst = this.getX(0);
    return `${path} L ${xLast} ${height} L ${xFirst} ${height} Z`;
  }

  getX(index: number): number {
    const count = this.salesChartData.length;
    if (count <= 1) return 0;
    return (index / (count - 1)) * 100 * 3; // Scale to viewBox width (300)
  }

  getY(value: number): number {
    const max = this.getMaxChartValue();
    if (max === 0) return 100; // Bottom
    // Use 70% of height for the line to leave room at top (20%) and bottom for X-axis labels implicitly space
    return 90 - (value / max) * 70;
  }

  // Get subset of data for X-axis labels (prevent overcrowding)
  getAxisLabels(): any[] {
    const count = this.salesChartData.length;
    if (count <= 7) return this.salesChartData; // Show all if few

    // Show ~5-7 labels max
    const step = Math.ceil(count / 6);
    return this.salesChartData.filter((_, i) => i % step === 0);
  }

  getXForLabel(label: string): number {
    const index = this.salesChartData.findIndex((d) => d.label === label);
    return this.getX(index);
  }

  onChartMouseMove(event: MouseEvent, svg: any) {
    if (!this.salesChartData.length) return;

    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const count = this.salesChartData.length;

    // Calculate nearest index
    // x / width = index / (count - 1)
    let index = Math.round((x / width) * (count - 1));

    // Clamp index
    if (index < 0) index = 0;
    if (index >= count) index = count - 1;

    this.hoverIndex = index;
  }
}
