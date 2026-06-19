import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/navigation.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { WebsocketService } from './services/websocket.service';
import { CelebrationService } from './services/celebration.service';
import { Subscription } from 'rxjs';
import { ReactionEvent } from './models/auction.model';

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number; // horizontal position percentage
  size: number; // random font size
  duration: number; // float duration
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'auction-frontend';
  private router = inject(Router);
  private currentRoute = '';
  
  wsService = inject(WebsocketService);
  celebrationService = inject(CelebrationService);
  
  // List of active floating reactions on screen
  floatingReactions = signal<FloatingReaction[]>([]);
  
  private subscription?: Subscription;

  constructor() {
    // Listen to router events to track current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  ngOnInit(): void {
    // Connect to WebSocket
    this.wsService.connect();

    // Listen to live reaction broadcasts
    this.subscription = this.wsService.reaction$.subscribe({
      next: (reaction: ReactionEvent) => {
        const newReaction: FloatingReaction = {
          id: reaction.id,
          emoji: reaction.emoji,
          left: Math.floor(Math.random() * 80) + 10, // 10% to 90%
          size: Math.floor(Math.random() * 20) + 24, // 24px to 44px
          duration: Math.random() * 1.5 + 2.5, // 2.5s to 4.0s
        };

        // Add to active reaction stream
        this.floatingReactions.update(list => [...list, newReaction]);

        // Automatically clean up this element after the animation finishes
        setTimeout(() => {
          this.floatingReactions.update(list => list.filter(r => r.id !== newReaction.id));
        }, 4000);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  shouldShowNavigation(): boolean {
    // Hide navigation for public-viewer and team-owner routes
    return !this.currentRoute.startsWith('/public') && 
           !this.currentRoute.startsWith('/team-owner');
  }
}
