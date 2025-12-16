import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour *ngIf
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'E-commerce Platform';
  isPublicLayout = true; // Par défaut, on affiche le layout public

  constructor(private router: Router) {}

  ngOnInit() {
    // Écouter chaque changement de navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Si l'URL commence par '/admin', on désactive le layout public (header/footer)
      this.isPublicLayout = !event.urlAfterRedirects.startsWith('/admin');
    });
  }
}
