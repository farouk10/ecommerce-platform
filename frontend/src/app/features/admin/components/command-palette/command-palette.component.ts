import {
  Component,
  HostListener,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
} from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';

interface SearchResult {
  group: string;
  id: string;
  title: string;
  description?: string;
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent implements OnInit {
  isOpen = false;
  searchControl = new FormControl('');
  selectedIndex = 0;

  // All results (Static + Async)
  filteredResults: SearchResult[] = [];

  // Static commands
  staticCommands: SearchResult[] = [];

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.initializeStaticCommands();
    this.filteredResults = this.staticCommands; // Initial state

    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim() === '') {
            return of(this.staticCommands);
          }
          return this.performSearch(query.toLowerCase());
        })
      )
      .subscribe((results) => {
        this.filteredResults = results;
        this.selectedIndex = 0;
      });
  }

  performSearch(query: string) {
    // 1. Filter Static Commands
    const staticResults = this.staticCommands.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.group.toLowerCase().includes(query)
    );

    // 2. Search Products
    const productSearch$ = this.productService.searchProducts(query, 0, 5).pipe(
      map((page) =>
        page.content.map(
          (p) =>
            ({
              group: 'Produits',
              id: `prod-${p.id}`,
              title: p.name,
              description: `${this.productService.formatPrice(
                p.price
              )} - Stock: ${p.stockQuantity}`,
              icon: '🛍️',
              action: () => this.navigate(`/admin/products/${p.id}`),
            } as SearchResult)
        )
      ),
      catchError(() => of([]))
    );

    // 3. Search Orders (Mock for now or specific API if available)
    // For now, if query looks like a number, suggest "Go to Order #X"
    const orderSearch$ = of([] as SearchResult[]);
    if (!isNaN(Number(query))) {
      // Quick Jump to Order
      const quickOrder: SearchResult = {
        group: 'Commandes',
        id: `ord-${query}`,
        title: `Aller à la commande #${query}`,
        description: 'Accès rapide',
        icon: '📦',
        action: () => this.navigate(`/admin/orders/${query}`),
      };
      // We could also verify if it exists via API check, but let's keep it snappy
    }

    return forkJoin([of(staticResults), productSearch$]).pipe(
      map(([staticRes, prodRes]) => {
        let results = [...staticRes, ...prodRes];

        // Add Order Quick Jump if numeric
        if (query.match(/^\d+$/)) {
          results.push({
            group: 'Actions Rapides',
            id: 'quick-order',
            title: `Ouvrir la commande #${query}`,
            icon: '🚀',
            action: () => this.navigate(`/admin/orders/${query}`),
          });
        }
        return results;
      })
    );
  }

  initializeStaticCommands() {
    this.staticCommands = [
      // Navigation
      {
        group: 'Navigation',
        id: 'nav-dash',
        title: 'Tableau de bord',
        icon: '🏠',
        action: () => this.navigate('/admin/dashboard'),
      },
      {
        group: 'Navigation',
        id: 'nav-orders',
        title: 'Commandes',
        icon: '📦',
        action: () => this.navigate('/admin/orders'),
      },
      {
        group: 'Navigation',
        id: 'nav-products',
        title: 'Produits',
        icon: '🏷️',
        action: () => this.navigate('/admin/products'),
      },
      {
        group: 'Navigation',
        id: 'nav-users',
        title: 'Utilisateurs',
        icon: '👥',
        action: () => this.navigate('/admin/users'),
      },
      {
        group: 'Navigation',
        id: 'nav-promo',
        title: 'Promotions',
        icon: '🎟️',
        action: () => this.navigate('/admin/promo'),
      },

      // Actions
      {
        group: 'Actions',
        id: 'act-new-product',
        title: 'Ajouter un Produit',
        icon: '➕',
        action: () => this.navigate('/admin/products/new'),
      },
      {
        group: 'Actions',
        id: 'act-print-orders',
        title: 'Imprimer Liste Commandes',
        icon: '🖨️',
        action: () => {
          this.navigate('/admin/orders');
          setTimeout(() => window.print(), 500);
        },
      },
    ];
  }

  // Global Shortcut
  @HostListener('window:keydown.meta.k', ['$event'])
  @HostListener('window:keydown.control.k', ['$event'])
  onKeydown(event: any) {
    const e = event as KeyboardEvent;
    e.preventDefault();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 50);
      this.searchControl.setValue('');
      this.selectedIndex = 0;
    }
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEsc(event: any) {
    if (this.isOpen) {
      this.isOpen = false;
    }
  }

  @HostListener('window:keydown.arrowdown', ['$event'])
  onArrowDown(event: any) {
    if (!this.isOpen) return;
    const e = event as KeyboardEvent;
    e.preventDefault();
    this.selectedIndex = Math.min(
      this.selectedIndex + 1,
      this.filteredResults.length - 1
    );
    this.ensureVisible();
  }

  @HostListener('window:keydown.arrowup', ['$event'])
  onArrowUp(event: any) {
    if (!this.isOpen) return;
    const e = event as KeyboardEvent;
    e.preventDefault();
    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    this.ensureVisible();
  }

  @HostListener('window:keydown.enter', ['$event'])
  onEnter(event: any) {
    if (!this.isOpen) return;
    const e = event as KeyboardEvent;
    e.preventDefault();
    this.selectResult(this.filteredResults[this.selectedIndex]);
  }

  ensureVisible() {
    // Todo: Scroll logic
  }

  selectResult(result: SearchResult) {
    if (!result) return;
    this.isOpen = false;
    result.action();
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  close() {
    this.isOpen = false;
  }
}
