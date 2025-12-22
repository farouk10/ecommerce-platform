import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import {
  switchMap,
  map,
  retry,
  shareReplay,
  distinctUntilChanged,
} from 'rxjs/operators';
import { OrderService } from './order.service';
import { ProductService } from './product.service';

export interface AdminNotification {
  id: string;
  type: 'ORDER' | 'STOCK' | 'SYSTEM';
  message: string;
  link?: string;
  timestamp: Date;
  read: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable({
  providedIn: 'root',
})
export class AdminNotificationService implements OnDestroy {
  private readonly STORAGE_KEY = 'admin_notifications';

  private notificationsSubject = new BehaviorSubject<AdminNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  // Badge Counter (Independent of list size - derived from unread active items)
  private unseenCountSubject = new BehaviorSubject<number>(0);
  unseenCount$ = this.unseenCountSubject.asObservable();

  private pollingSub: Subscription | undefined;

  // State tracking for diffing
  private lastTotalOrders = -1;
  private lastPendingOrders = -1;

  // Sound Effect (Shopify-like "Cha-Ching" or Bell)
  // Using a reliable notification sound URL (glassy ping)
  private readonly SOUND_URL =
    'https://sfxcontent.s3.amazonaws.com/soundfx/CashRegister.mp3';
  private audio = new Audio(this.SOUND_URL);

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {
    this.loadFromStorage(); // Load saved notifications
    this.startPolling();
    this.audio.volume = 0.5; // Moderate volume
  }

  private loadFromStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        this.notificationsSubject.next(notificationsWithDates);
        // We don't restore the "Badge" count (unseen) on refresh usually,
        // or we can set it to the count of unread items if we want.
        // Let's set badge to 0 on fresh load to not annoy, or set it to count?
        // User said: "Number will disappear if I clicked on the icon".
        // So on refresh, let's assume valid state is clear badge unless new stuff comes.
        this.unseenCountSubject.next(0);
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(this.notificationsSubject.value)
    );
  }

  // ... Polling Logic remains the same ...

  private startPolling() {
    // Poll every 15 seconds
    this.pollingSub = timer(0, 15000)
      .pipe(
        switchMap(() => this.orderService.getAdminStats().pipe(retry(1))),
        shareReplay(1)
      )
      .subscribe({
        next: (stats: any) => {
          this.checkForNewOrders(stats);
          this.checkForPendingOrders(stats);
        },
        error: (err) => console.error('Notification Polling Error', err),
      });

    // Also check stock every 60 seconds
    timer(0, 60000)
      .pipe(switchMap(() => this.productService.getProducts({ size: 100 })))
      .subscribe({
        next: (page) => this.checkStockLevels(page.content),
        error: (err) => console.error('Stock Polling Error', err),
      });
  }

  private checkForNewOrders(stats: any) {
    // Initial Load - Sync without notifying
    if (this.lastTotalOrders === -1) {
      this.lastTotalOrders = stats.totalOrders;
      return;
    }

    // New Order Detected
    if (stats.totalOrders > this.lastTotalOrders) {
      const diff = stats.totalOrders - this.lastTotalOrders;

      this.playSound(); // PLAY SOUND HERE!

      this.addNotification({
        id: Date.now().toString(),
        type: 'ORDER',
        message: `🎉 ${diff} nouvelle(s) commande(s) reçue(s) !`,
        link: '/admin/orders',
        timestamp: new Date(),
        read: false,
        priority: 'HIGH',
      });
      this.lastTotalOrders = stats.totalOrders;
    }
  }

  private playSound() {
    // Browser Autoplay Policy: User must interact with page first.
    // We assume Admin has clicked somewhere.
    this.audio
      .play()
      .catch((err) =>
        console.warn('Audio play blocked (Autoplay policy):', err)
      );
  }

  private checkForPendingOrders(stats: any) {
    if (
      stats.pendingOrders > 0 &&
      stats.pendingOrders !== this.lastPendingOrders
    ) {
      // Optionally notify about pending backlog status, but maybe too spammy?
      // Let's just update internal state for now or add a summary if it grows
      this.lastPendingOrders = stats.pendingOrders;
    }
  }

  private checkStockLevels(products: any[]) {
    let lowStockCount = 0;
    products.forEach((p) => {
      if (p.stockQuantity < 10) lowStockCount++;
    });

    if (lowStockCount > 0) {
      // Check if we already have a stock alert to avoid duplicates?
      // For simplicity, we'll just add one if not recently added or just update a status.
      // Let's simple add one if not exists in unread
      const exists = this.notificationsSubject.value.some(
        (n) => n.type === 'STOCK'
      );
      if (!exists) {
        this.addNotification({
          id: 'stock-' + Date.now(),
          type: 'STOCK',
          message: `⚠️ ${lowStockCount} produits en stock faible/rupture.`,
          link: '/admin/products',
          timestamp: new Date(),
          read: false,
          priority: 'MEDIUM',
        });
      }
    }
  }

  addNotification(notification: AdminNotification) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);

    // Increment Badge
    const currentUnseen = this.unseenCountSubject.value;
    this.unseenCountSubject.next(currentUnseen + 1);
  }

  // Called when user opens the dropdown -> Clear Badge
  clearBadge() {
    this.unseenCountSubject.next(0);
  }

  // Called when user clicks "Read" or "X" -> Remove from list
  dismiss(id: string) {
    const current = this.notificationsSubject.value;
    const updated = current.filter((n) => n.id !== id);
    this.notificationsSubject.next(updated);
  }

  clearAll() {
    this.notificationsSubject.next([]);
    this.unseenCountSubject.next(0);
  }

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
