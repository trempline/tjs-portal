import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Nous } from './nous/nous';
import { Entreprises } from './entreprises/entreprises';
import { About } from './about/about';
import { Login } from './login/login';
import { MemberLogin } from './member-login/member-login';
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
import { MembershipDetail } from './backoffice/membership-detail/membership-detail';
import { MemberTiers } from './backoffice/member-tiers/member-tiers';
import { EventDomains } from './backoffice/event-domains/event-domains';
import { EventTypes } from './backoffice/event-types/event-types';
import { AccountSettings } from './backoffice/account-settings/account-settings';
import { AuthCallback } from './auth-callback/auth-callback';
import { TestHostCreationComponent } from './test-host-creation/test-host-creation.component';
import { PublicEvents } from './public-events/public-events';
import { PublicEventDetailComponent } from './public-event-detail/public-event-detail';
import { PublicArtists } from './public-artists/public-artists';
import { PublicArtistDetail } from './public-artist-detail/public-artist-detail';
import { PublicLocations } from './public-locations/public-locations';
import { PublicLocationDetail } from './public-location-detail/public-location-detail';
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
import { HostArtists } from './backoffice/host-artists/host-artists';
import { HostNewEvent } from './backoffice/host-new-event/host-new-event';
import { ArtistProfile } from './backoffice/artist-profile/artist-profile';
import { ArtistInstruments } from './backoffice/artist-instruments/artist-instruments';
import { ArtistRequirements } from './backoffice/artist-requirements/artist-requirements';
import { ArtistMedia } from './backoffice/artist-media/artist-media';
import { ArtistPreview } from './backoffice/artist-preview/artist-preview';
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
        path: 'artists',
        component: PublicArtists,
    },
    {
        path: 'artists/:id',
        component: PublicArtistDetail,
    },
    {
        path: 'locations',
        component: PublicLocations,
    },
    {
        path: 'locations/:id',
        component: PublicLocationDetail,
    },
    {
        path: 'events/:id',
        component: PublicEventDetailComponent,
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'admin',
        component: Login,
        data: { defaultRole: 'admin' },
    },
    {
        path: 'artist-login',
        component: Login,
        data: { defaultRole: 'artist' },
    },
    {
        path: 'committee-login',
        component: Login,
        data: { defaultRole: 'committee' },
    },
    {
        path: 'host-manager-login',
        component: Login,
        data: { defaultRole: 'host-manager' },
    },
    {
        path: 'host-login',
        component: Login,
        data: { defaultRole: 'host' },
    },
    {
        path: 'host-plus-login',
        component: Login,
        data: { defaultRole: 'host-plus' },
    },
    {
        path: 'member-login',
        component: MemberLogin,
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
            loginRoute: '/login',
            defaultRole: 'artist',
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
            { path: 'event-requests/:id', component: HostArtistRequestDetail, canActivate: [roleGuard(['Admin', 'Community Member'])] },
            { path: 'artists', component: Artists },
            { path: 'artists/tjs', component: Artists },
            { path: 'artists/invited', component: Artists },
            { path: 'artists/non-tjs', component: NonTjsArtists, canActivate: [roleGuard(['Community Member'])] },
            { path: 'artists/non-tjs/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Community Member'])] },
            { path: 'artists/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Admin', 'Community Member'])] },
            { path: 'hosts', component: Hosts, canActivate: [roleGuard(['Admin'])] },
            { path: 'host-plus', component: Hosts, canActivate: [roleGuard(['Admin'])], data: { hostPlus: true } },
            {
                path: 'host-plus/home',
                loadComponent: () => import('./backoffice/host-plus-home/host-plus-home').then(m => m.HostPlusHome),
                canActivate: [roleGuard(['Host+'])],
            },
            {
                path: 'host-plus/events',
                loadComponent: () => import('./backoffice/host-plus-events/host-plus-events').then(m => m.HostPlusEvents),
                canActivate: [roleGuard(['Host+'])],
            },
            {
                path: 'host-plus/events/:eventId',
                loadComponent: () => import('./backoffice/host-plus-event-detail/host-plus-event-detail').then(m => m.HostPlusEventDetail),
                canActivate: [roleGuard(['Host+'])],
            },
            {
                path: 'host-plus/events/:eventId/create-tjs',
                loadComponent: () => import('./backoffice/host-plus-create-tjs-event/host-plus-create-tjs-event').then(m => m.HostPlusCreateTjsEvent),
                canActivate: [roleGuard(['Host+'])],
            },
            {
                path: 'host-plus/artists',
                loadComponent: () => import('./backoffice/host-plus-artists/host-plus-artists').then(m => m.HostPlusArtists),
                canActivate: [roleGuard(['Host+'])],
            },
            { path: 'host-plus/communication-center', component: ArtistMessages, canActivate: [roleGuard(['Host+'])] },
            { path: 'host-plus/notification', component: ArtistNotifications, canActivate: [roleGuard(['Host+'])] },
            {
                path: 'host-plus/settings',
                loadComponent: () => import('./backoffice/host-plus-settings/host-plus-settings').then(m => m.HostPlusSettings),
                canActivate: [roleGuard(['Host+'])],
            },
            {
                path: 'host-plus/:id/events',
                loadComponent: () => import('./backoffice/host-plus-events/host-plus-events').then(m => m.HostPlusEvents),
                canActivate: [roleGuard(['Admin'])],
            },
            {
                path: 'host-plus/:id/events/:eventId',
                loadComponent: () => import('./backoffice/host-plus-event-detail/host-plus-event-detail').then(m => m.HostPlusEventDetail),
                canActivate: [roleGuard(['Admin'])],
            },
            {
                path: 'host-plus/:id/events/:eventId/create-tjs',
                loadComponent: () => import('./backoffice/host-plus-create-tjs-event/host-plus-create-tjs-event').then(m => m.HostPlusCreateTjsEvent),
                canActivate: [roleGuard(['Admin'])],
            },
            { path: 'locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Admin'])] },
            { path: 'locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Admin'])] },
            { path: 'locations/private', component: HostPrivateLocations, canActivate: [roleGuard(['Admin'])] },
            { path: 'locations/private/:id', component: HostPrivateLocationDetail, canActivate: [roleGuard(['Admin'])] },
            { path: 'my-hosts', component: MyHosts },
            { path: 'host/dashboard', component: ArtistWorkspacePage, canActivate: [roleGuard(['Host', 'Host+'])], data: { title: 'Dashboard', description: 'This host dashboard page is intentionally blank for now.' } },
            { path: 'host/events', component: HostEvents, canActivate: [roleGuard(['Host', 'Host+'])] },
            { path: 'host/events/new', component: HostNewEvent, canActivate: [roleGuard(['Host', 'Host+'])] },
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
            { path: 'host/locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Community Member'])] },
            { path: 'host/locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Community Member'])] },
            { path: 'events', component: Events },
            { path: 'events/:id', component: HostEventDetail, canActivate: [roleGuard(['Admin', 'Community Member'])] },
            { path: 'membership', component: Membership, canActivate: [roleGuard(['Admin'])] },
            { path: 'membership/:id', component: MembershipDetail, canActivate: [roleGuard(['Admin'])] },
            { path: 'configuration/member-tiers', component: MemberTiers, canActivate: [roleGuard(['Admin'])] },
            { path: 'configuration/domains', component: EventDomains, canActivate: [roleGuard(['Admin'])] },
            { path: 'configuration/event-types', component: EventTypes, canActivate: [roleGuard(['Admin'])] },
            { path: 'user-management', component: UserManagement, canActivate: [roleGuard(['Admin'])] },
            { path: 'committee-members', component: CommitteeMembers, canActivate: [roleGuard(['Admin'])] },
            { path: 'committee-dashboard', component: CommitteeDashboard, canActivate: [roleGuard(['Community Member'])] },
            { path: 'artist-dashboard', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Dashboard', description: 'Overview of your artist workspace.' } },
            { path: 'artist-profile', component: ArtistProfile, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-instruments', component: ArtistInstruments, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requirements', component: ArtistRequirements, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-media', component: ArtistMedia, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests/new', component: ArtistRequests, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests/:requestId', component: ArtistRequests, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-requests', component: ArtistRequests, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-availability', component: ArtistAvailability, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-preview', component: ArtistPreview, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-events', component: ArtistEvents, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-events/:id', component: HostEventDetail, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'artist-messages', component: ArtistMessages, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'committee-messages', component: ArtistMessages, canActivate: [roleGuard(['Community Member'])] },
            { path: 'artist-notifications', component: ArtistNotifications, canActivate: [roleGuard(['Artist', 'Artist Invited'])] },
            { path: 'committee-notifications', component: ArtistNotifications, canActivate: [roleGuard(['Community Member'])] },
            { path: 'artist-settings', component: ArtistWorkspacePage, canActivate: [roleGuard(['Artist', 'Artist Invited'])], data: { title: 'Settings', description: 'Configure your artist workspace preferences and account settings.' } },
            { path: 'account-settings', component: AccountSettings },
            { path: 'host-manager', component: HostManagerDashboard, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/hosts', component: HostManagerHosts, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/hosts/:id', component: HostManagerHostDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/events', component: Events, canActivate: [roleGuard(['Host Manager'])], data: { title: 'Events', description: 'View events assigned to your managed hosts.' } },
            { path: 'host-manager/events/new', component: HostNewEvent, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/events/:id', component: HostEventDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/requests', component: EventRequests, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/requests/:id', component: HostArtistRequestDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/requests/:id/create-event', component: HostCreateEvent, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/messages', component: ArtistMessages, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/artists/tjs', component: Artists, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/artists/tjs/:id', component: CommitteeArtistDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Community Member'])] },
            { path: 'host-manager/locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Host', 'Host+', 'Host Manager', 'Community Member'])] },
            { path: 'host-manager/locations/private', component: HostPrivateLocations, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'host-manager/locations/private/:id', component: HostPrivateLocationDetail, canActivate: [roleGuard(['Host Manager'])] },
            { path: 'committee/locations/public', component: HostManagerPublicLocations, canActivate: [roleGuard(['Community Member'])] },
            { path: 'committee/locations/public/:id', component: HostManagerPublicLocationDetail, canActivate: [roleGuard(['Community Member'])] },
        ],
    },
];
