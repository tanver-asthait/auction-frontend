import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { TeamOwnerComponent } from './pages/team-owner/team-owner.component';
import { PublicViewerComponent } from './pages/public-viewer/public-viewer.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/public',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    component: AdminComponent,
    title: 'Admin Dashboard'
  },
  {
    path: 'team-owner',
    component: TeamOwnerComponent,
    title: 'Team Owner Dashboard'
  },
  {
    path: 'public',
    component: PublicViewerComponent,
    title: 'Public Auction Viewer'
  },
  {
    path: '**',
    redirectTo: '/public'
  }
];
