import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Nous } from './nous/nous';
import { Entreprises } from './entreprises/entreprises';
import { About } from './about/about';
import { AdminLogin } from './admin-login/admin-login';
import { ArtistLogin } from './artist-login/artist-login';
import { BackofficeLayout } from './backoffice/backoffice-layout/backoffice-layout';
import { Dashboard } from './backoffice/dashboard/dashboard';
import { EventRequests } from './backoffice/event-requests/event-requests';
import { Artists } from './backoffice/artists/artists';
import { Hosts } from './backoffice/hosts/hosts';
import { Events } from './backoffice/events/events';
import { UserManagement } from './backoffice/user-management/user-management';
import { MyHosts } from './backoffice/my-hosts/my-hosts';
import { CommitteeMembers } from './backoffice/committee-members/committee-members';
import { CommitteeDashboard } from './backoffice/committee-dashboard/committee-dashboard.component';
import { Membership } from './backoffice/membership/membership';
import { AccountSettings } from './backoffice/account-settings/account-settings';
import { AuthCallback } from './auth-callback/auth-callback';
import { TestHostCreationComponent } from './test-host-creation/test-host-creation.component';
import { HostManagerHosts } from './backoffice/host-manager-hosts/host-manager-hosts';
import { NonTjsArtists } from './backoffice/non-tjs-artists/non-tjs-artists';
import { ArtistWorkspacePage } from './backoffice/artist-workspace-page/artist-workspace-page';
import { ArtistProfile } from './backoffice/artist-profile/artist-profile';
import { ArtistInstruments } from './backoffice/artist-instruments/artist-instruments';
import { ArtistRequirements } from './backoffice/artist-requirements/artist-requirements';
import { ArtistMedia } from './backoffice/artist-media/artist-media';
import { ArtistAvailability } from './backoffice/artist-availability/artist-availability';
import { ArtistNotifications } from './backoffice/artist-notifications/artist-notifications';
import { authGuard, roleGuard } from './guards/auth.guard';

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
        path: 'artist-login',
        component: ArtistLogin,
    },
    {
        // Handles Supabase email invite / password-reset magic links
        path: 'auth/callback',
        component: AuthCallback,
    },
    {
        path: 'artist/auth/callback',
        component: AuthCallback,
        data: {
            loginRoute: '/artist-login',
            successRoute: '/backoffice/artist-dashboard',
            activationTitle: 'Activate Artist Account',
        },
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
            { path: 'dashboard', component: Dashboard, canActivate: [roleGuard(['Admin'])] },
            { path: 'event-requests', component: EventRequests },
            { path: 'artists', component: Artists },
            { path: 'artists/tjs', component: Artists },
            { path: 'artists/invited', component: Artists },
            { path: 'artists/non-tjs', component: NonTjsArtists, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'hosts', component: Hosts, canActivate: [roleGuard(['Admin'])] },
            { path: 'my-hosts', component: MyHosts },
            { path: 'events', component: Events },
            { path: 'membership', component: Membership, canActivate: [roleGuard(['Admin'])] },
            { path: 'user-management', component: UserManagement, canActivate: [roleGuard(['Admin'])] },
            { path: 'committee-members', component: CommitteeMembers, canActivate: [roleGuard(['Admin'])] },
            { path: 'committee-dashboard', component: CommitteeDashboard, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'artist-dashboard', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Dashboard', description: 'Overview of your artist workspace.' } },
            { path: 'artist-profile', component: ArtistProfile, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-instruments', component: ArtistInstruments, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requirements', component: ArtistRequirements, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-media', component: ArtistMedia, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Request', description: 'Review and manage artist-side requests and submissions.' } },
            { path: 'artist-availability', component: ArtistAvailability, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-events', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Events', description: 'View upcoming and past events associated with your profile.' } },
            { path: 'artist-messages', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Message Center', description: 'Read and manage your artist communications.' } },
            { path: 'artist-notifications', component: ArtistNotifications, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-settings', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Settings', description: 'Configure your artist workspace preferences and account settings.' } },
            { path: 'account-settings', component: AccountSettings },
            { path: 'host-manager', redirectTo: 'my-hosts', pathMatch: 'full' },
            { path: 'host-manager/hosts', component: HostManagerHosts },
            { path: 'host-manager/hosts/:id', component: HostManagerHosts },
            { path: 'host-manager/messages', redirectTo: 'my-hosts', pathMatch: 'full' },
            { path: 'host-manager/messages/:userId', redirectTo: 'my-hosts', pathMatch: 'full' },
            { path: 'host-manager/suggest', redirectTo: 'my-hosts', pathMatch: 'full' },
        ],
    },
];
