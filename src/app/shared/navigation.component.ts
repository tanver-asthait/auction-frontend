import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="main-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <h2>Auction Manager</h2>
        </div>
        <div class="nav-links">
          <a routerLink="/public" routerLinkActive="active">Public View</a>
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
          <a routerLink="/teams-management" routerLinkActive="active">Teams</a>
          <a routerLink="/players-management" routerLinkActive="active">Players</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .main-nav {
      background: #2c3e50;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      height: 60px;
    }

    .nav-brand h2 {
      margin: 0;
      color: white;
      font-size: 20px;
      font-weight: 600;
    }

    .nav-links {
      display: flex;
      gap: 24px;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .nav-links a:hover,
    .nav-links a.active {
      background: #34495e;
    }

    @media (max-width: 768px) {
      .nav-container {
        flex-direction: column;
        height: auto;
        padding: 16px 20px;
      }

      .nav-links {
        margin-top: 16px;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
  `]
})
export class NavigationComponent { }