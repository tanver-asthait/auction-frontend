import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { TeamOwnerComponent } from './pages/team-owner/team-owner.component';
import { PublicViewerComponent } from './pages/public-viewer/public-viewer.component';
import { TeamsManagementComponent } from './pages/teams-management/teams-management.component';
import { PlayersManagementComponent } from './pages/players-management/players-management.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/public',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    component: AdminComponent,
    title: 'Admin Dashboard',
  },
  {
    path: 'teams-management',
    component: TeamsManagementComponent,
    title: 'Teams Management',
  },
  {
    path: 'players-management',
    component: PlayersManagementComponent,
    title: 'Players Management',
  },
  {
    path: 'team-owner/:teamId',
    component: TeamOwnerComponent,
    title: 'Team Owner Dashboard',
  },
  {
    path: 'public',
    component: PublicViewerComponent,
    title: 'Public Auction Viewer',
  },
  {
    path: '**',
    redirectTo: '/public',
  },
];
