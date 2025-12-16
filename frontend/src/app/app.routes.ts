import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // ✅ On utilise uniquement authGuard
import { adminGuard } from './core/guards/admin.guard'; // ✅ Import explicite du guard admin
import { customerGuard } from './core/guards/customer.guard';
import { rootGuard } from './core/guards/root.guard';
import { notFoundGuard } from './core/guards/not-found.guard';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // --- ROUTES PUBLIQUES ---
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Accueil - E-commerce',
    canActivate: [rootGuard], // ✅ Redirige Admin -> /admin
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/product-list/product-list.component').then(
        (m) => m.ProductListComponent
      ),
    title: 'Nos Produits',
    canActivate: [rootGuard], // ✅ Redirige Admin -> /admin
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import(
        './features/products/product-detail/product-detail.component'
      ).then((m) => m.ProductDetailComponent),
    title: 'Détail du Produit',
    canActivate: [rootGuard], // ✅ Redirige Admin -> /admin
  },

  // --- AUTHENTIFICATION (Redirection si déjà connecté possible via un guestGuard, mais optionnel) ---
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Connexion',
    canActivate: [rootGuard], // ✅ Si Admin se connecte, ou est déjà connecté, on redirige
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    title: 'Inscription',
    canActivate: [rootGuard], // ✅ Redirige Admin -> /admin (pas d'inscription si déjà admin)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
    title: 'Mot de passe oublié',
    canActivate: [rootGuard],
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
    title: 'Réinitialisation du mot de passe',
    canActivate: [rootGuard],
  },

  // --- ROUTES CLIENT (Protégées) ---
  // Pas besoin de rôle spécifique, juste être connecté
  {
    path: '',
    canActivate: [authGuard, customerGuard], // ✅ Bloque l'Admin ici
    children: [
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/order-list/order-list.component').then(
            (m) => m.OrderListComponent
          ),
        title: 'Mes Commandes',
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent
          ),
        title: 'Détail de la Commande',
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/orders/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          ),
        title: 'Panier & Paiement',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        title: 'Mon Profil',
      },
    ],
  },

  // --- ROUTES ADMIN (Protégées + Rôle ADMIN) ---
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [authGuard, adminGuard],
  },

  // --- WILDCARD (404) ---
  {
    path: '**',
    // Ce composant ne s'affichera jamais car le Guard redirige avant
    canActivate: [notFoundGuard],
    component: HomeComponent, // ✅ Le Guard décide de la redirection (Admin -> Dashboard, User -> Home)
  },
];
