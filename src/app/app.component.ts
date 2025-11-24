import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/navigation.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'auction-frontend';
  private router = inject(Router);
  private currentRoute = '';

  constructor() {
    // Listen to router events to track current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  shouldShowNavigation(): boolean {
    // Hide navigation for public-viewer and team-owner routes
    return !this.currentRoute.startsWith('/public') && 
           !this.currentRoute.startsWith('/team-owner');
  }
}
