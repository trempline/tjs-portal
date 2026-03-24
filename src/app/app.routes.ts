import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Nous } from './nous/nous';
import { Entreprises } from './entreprises/entreprises';
import { About } from './about/about';
import { AdminLogin } from './admin-login/admin-login';
import { BackofficeLayout } from './backoffice/backoffice-layout/backoffice-layout';
import { Dashboard } from './backoffice/dashboard/dashboard';
import { EventRequests } from './backoffice/event-requests/event-requests';
import { Artists } from './backoffice/artists/artists';
import { Hosts } from './backoffice/hosts/hosts';
import { Events } from './backoffice/events/events';
import { UserManagement } from './backoffice/user-management/user-management';
import { MyHosts } from './backoffice/my-hosts/my-hosts';
import { CommitteeMembers } from './backoffice/committee-members/committee-members';
import { AuthCallback } from './auth-callback/auth-callback';
import { TestHostCreationComponent } from './test-host-creation/test-host-creation.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: Home,
    },
    {
        path: 'nous-soutenir',
        component: Nous,
    },
    {
        path: 'enterprises',
        component: Entreprises,
    },
    {
        path: 'about',
        component: About,
    },
    {
        path: 'admin',
        component: AdminLogin,
    },
    {
        // Handles Supabase email invite / password-reset magic links
        path: 'auth/callback',
        component: AuthCallback,
    },
    {
        path: 'test-host-creation',
        component: TestHostCreationComponent,
    },
    {
        path: 'backoffice',
        component: BackofficeLayout,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: Dashboard },
            { path: 'event-requests', component: EventRequests },
            { path: 'artists', component: Artists },
            { path: 'artists/tjs', component: Artists },
            { path: 'artists/invited', component: Artists },
            { path: 'hosts', component: Hosts },
            { path: 'my-hosts', component: MyHosts },
            { path: 'events', component: Events },
            { path: 'user-management', component: UserManagement },
            { path: 'committee-members', component: CommitteeMembers },
        ],
    },
];
