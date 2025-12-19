import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '', // The root path for children of /admin
    loadComponent: () =>
      import('./admin.component').then((m) => m.AdminComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        title: 'Admin - Tableau de bord',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/products-admin.component').then(
            (m) => m.ProductsAdminComponent
          ),
        title: 'Admin - Produits',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/orders-admin.component').then(
            (m) => m.OrdersAdminComponent
          ),
        title: 'Admin - Commandes',
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./orders/order-detail/admin-order-detail.component').then(
            (m) => m.AdminOrderDetailComponent
          ),
        title: 'Admin - Détail Commande',
      },
      {
        path: 'promo',
        loadComponent: () =>
          import('./promo/promo-admin.component').then(
            (m) => m.PromoAdminComponent
          ),
        title: 'Admin - Promotions',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/admin-profile.component').then(
            (m) => m.AdminProfileComponent
          ),
        title: 'Mon Profil Admin',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users-admin.component').then(
            (m) => m.UsersAdminComponent
          ),
        title: 'Admin - Utilisateurs',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
