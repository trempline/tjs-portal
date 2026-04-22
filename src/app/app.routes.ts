import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Nous } from './nous/nous';
import { Entreprises } from './entreprises/entreprises';
import { About } from './about/about';
import { AdminLogin } from './admin-login/admin-login';
import { ArtistLogin } from './artist-login/artist-login';
import { CommitteeLogin } from './committee-login/committee-login';
import { HostManagerLogin } from './host-manager-login/host-manager-login';
import { HostLogin } from './host-login/host-login';
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
import { PublicEvents } from './public-events/public-events';
import { PublicEventDetailComponent } from './public-event-detail/public-event-detail';
import { HostManagerHosts } from './backoffice/host-manager-hosts/host-manager-hosts';
import { HostManagerHostDetail } from './backoffice/host-manager-host-detail/host-manager-host-detail';
import { HostManagerDashboard } from './backoffice/host-manager-dashboard/host-manager-dashboard';
import { HostPrivateLocations } from './backoffice/host-private-locations/host-private-locations';
import { HostPrivateLocationDetail } from './backoffice/host-private-location-detail/host-private-location-detail';
import { HostManagerPublicLocationDetail } from './backoffice/host-manager-public-location-detail/host-manager-public-location-detail';
import { HostManagerPublicLocations } from './backoffice/host-manager-public-locations/host-manager-public-locations';
import { HostArtistRequestDetail } from './backoffice/host-artist-request-detail/host-artist-request-detail';
import { HostCreateEvent } from './backoffice/host-create-event/host-create-event';
import { NonTjsArtists } from './backoffice/non-tjs-artists/non-tjs-artists';
import { CommitteeArtistDetail } from './backoffice/committee-artist-detail/committee-artist-detail';
import { ArtistWorkspacePage } from './backoffice/artist-workspace-page/artist-workspace-page';
import { HostEvents } from './backoffice/host-events/host-events';
import { HostEventDetail } from './backoffice/host-event-detail/host-event-detail';
import { ArtistEvents } from './backoffice/artist-events/artist-events';
import { ArtistEventDetail } from './backoffice/artist-event-detail/artist-event-detail';
import { HostArtists } from './backoffice/host-artists/host-artists';
import { ArtistProfile } from './backoffice/artist-profile/artist-profile';
import { ArtistInstruments } from './backoffice/artist-instruments/artist-instruments';
import { ArtistRequirements } from './backoffice/artist-requirements/artist-requirements';
import { ArtistMedia } from './backoffice/artist-media/artist-media';
import { ArtistAvailability } from './backoffice/artist-availability/artist-availability';
import { ArtistRequests } from './backoffice/artist-requests/artist-requests';
import { ArtistMessages } from './backoffice/artist-messages/artist-messages';
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
        path: 'events',
        component: PublicEvents,
    },
    {
        path: 'events/:id',
        component: PublicEventDetailComponent,
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
        path: 'committee-login',
        component: CommitteeLogin,
    },
    {
        path: 'host-manager-login',
        component: HostManagerLogin,
    },
    {
        path: 'host-login',
        component: HostLogin,
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
            { path: 'event-requests/:id', component: HostArtistRequestDetail, canActivate: [roleGuard(['Admin', 'Committee Member'])] },
            { path: 'artists', component: Artists },
            { path: 'artists/tjs', component: Artists },
            { path: 'artists/invited', component: Artists },
            { path: 'artists/non-tjs', component: NonTjsArtists, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'artists/non-tjs/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'artists/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'hosts', component: Hosts, canActivate: [roleGuard(['Admin'])] },
            { path: 'my-hosts', component: MyHosts },
            { path: 'host/dashboard', component: ArtistWorkspacePage, canActivate: [roleGuard(['Host', 'Host+'])], data: { title: 'Dashboard', description: 'This host dashboard page is intentionally blank for now.' } },
            { path: 'host/events', component: HostEvents, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/events/:id', component: HostEventDetail, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/requests', component: EventRequests, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/requests/:id', component: HostArtistRequestDetail, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/requests/:id/create-event', component: HostCreateEvent, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'event-requests/:id/create-event', component: HostCreateEvent, canActivate: [roleGuard(['Admin'])] },
            { path: 'host/artists', component: HostArtists, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/artists/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host-messages', component: ArtistMessages, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host-notifications', component: ArtistNotifications, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/locations/my', component: HostPrivateLocations, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/locations/my/:id', component: HostPrivateLocationDetail, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Committee Member'])] },
            { path: 'host/locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Committee Member'])] },
            { path: 'events', component: Events },
            { path: 'events/:id', component: HostEventDetail, canActivate: [roleGuard(['Admin', 'Committee Member'])] },
            { path: 'membership', component: Membership, canActivate: [roleGuard(['Admin'])] },
            { path: 'user-management', component: UserManagement, canActivate: [roleGuard(['Admin'])] },
            { path: 'committee-members', component: CommitteeMembers, canActivate: [roleGuard(['Admin'])] },
            { path: 'committee-dashboard', component: CommitteeDashboard, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'artist-dashboard', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Dashboard', description: 'Overview of your artist workspace.' } },
            { path: 'artist-profile', component: ArtistProfile, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-instruments', component: ArtistInstruments, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requirements', component: ArtistRequirements, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-media', component: ArtistMedia, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests/new', component: ArtistRequests, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests/:requestId', component: ArtistRequests, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests', component: ArtistRequests, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-availability', component: ArtistAvailability, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-events', component: ArtistEvents, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-events/:id', component: ArtistEventDetail, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-messages', component: ArtistMessages, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'committee-messages', component: ArtistMessages, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'artist-notifications', component: ArtistNotifications, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'committee-notifications', component: ArtistNotifications, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'artist-settings', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Settings', description: 'Configure your artist workspace preferences and account settings.' } },
            { path: 'account-settings', component: AccountSettings },
            { path: 'host-manager', component: HostManagerDashboard, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/hosts', component: HostManagerHosts, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/hosts/:id', component: HostManagerHostDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/events', component: Events, canActivate: [roleGuard(['Host Manager'])], data: { title: 'Events', description: 'View events assigned to your managed hosts.' } },
            { path: 'host-manager/events/:id', component: HostEventDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/requests', component: EventRequests, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/requests/:id', component: HostArtistRequestDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/requests/:id/create-event', component: HostCreateEvent, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/messages', component: ArtistMessages, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/artists/tjs', component: Artists, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/artists/tjs/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Committee Member'])] },
            { path: 'host-manager/locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Committee Member'])] },
            { path: 'host-manager/locations/private', component: HostPrivateLocations, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/locations/private/:id', component: HostPrivateLocationDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'committee/locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Committee Member'])] },
            { path: 'committee/locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Committee Member'])] },
        ],
    },
];
