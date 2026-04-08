import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, SupabaseService, TjsArtist } from '../../services/supabase.service';

interface CommitteeWorkspaceStats {
  totalArtists: number;
  activeArtists: number;
  pendingArtists: number;
  featuredArtists: number;
  myEvents: number;
  myRequests: number;
  platformEvents: number;
  platformRequests: number;
}

@Component({
  selector: 'app-committee-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterModule],
  templateUrl: './committee-dashboard.component.html',
  styleUrl: './committee-dashboard.component.scss'
})
export class CommitteeDashboard implements OnInit {
  authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  myArtists: TjsArtist[] = [];
  overview: AdminEventOverviewItem[] = [];
  stats: CommitteeWorkspaceStats = {
    totalArtists: 0,
    activeArtists: 0,
    pendingArtists: 0,
    featuredArtists: 0,
    myEvents: 0,
    myRequests: 0,
    platformEvents: 0,
    platformRequests: 0,
  };

  async ngOnInit(): Promise<void> {
    if (!this.authService.isCommitteeMember) {
      this.error = 'Access denied. Committee Member role required.';
      this.isLoading = false;
      return;
    }

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      const currentUserId = this.authService.currentUser?.id ?? '';
      const scope = currentUserId
        ? { committeeMemberId: currentUserId, createdById: currentUserId }
        : undefined;

      const [artists, overview] = await Promise.all([
        this.supabase.getArtists(scope),
        this.supabase.getAdminEventOverview(),
      ]);

      this.myArtists = artists;
      this.overview = overview;
      this.computeStats();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load committee workspace.';
    } finally {
      this.isLoading = false;
    }
  }

  private computeStats(): void {
    const myArtistIds = new Set(this.myArtists.map((artist) => artist.id));
    const myOverview = this.overview.filter((item) => item.artist_ids.some((artistId) => myArtistIds.has(artistId)));
    const myEvents = myOverview.filter((item) => item.event_type === 'EVENT_INSTANCE');
    const myRequests = myOverview.filter((item) => item.event_type === 'REQUEST');

    this.stats = {
      totalArtists: this.myArtists.length,
      activeArtists: this.myArtists.filter((artist) => artist.activation_status === 'active').length,
      pendingArtists: this.myArtists.filter((artist) => artist.activation_status === 'pending').length,
      featuredArtists: this.myArtists.filter((artist) => artist.is_featured).length,
      myEvents: myEvents.length,
      myRequests: myRequests.length,
      platformEvents: this.overview.filter((item) => item.event_type === 'EVENT_INSTANCE').length,
      platformRequests: this.overview.filter((item) => item.event_type === 'REQUEST').length,
    };
  }

  get recentArtists(): TjsArtist[] {
    return this.myArtists.slice(0, 5);
  }

  activationStatusLabel(artist: TjsArtist): string {
    switch (artist.activation_status) {
      case 'active':
        return 'Activated';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Pending';
    }
  }

  activationStatusClass(artist: TjsArtist): string {
    switch (artist.activation_status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'inactive':
        return 'bg-zinc-100 text-zinc-600 border border-zinc-200';
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  }

  artistFlags(artist: TjsArtist): string[] {
    const flags: string[] = [];
    if (artist.is_tjs_artist) {
      flags.push('TJS');
    }
    if (artist.is_invited_artist) {
      flags.push('Invited');
    }
    if (artist.is_featured) {
      flags.push('Featured');
    }
    return flags;
  }

  displayName(artist: TjsArtist): string {
    return artist.profile?.full_name || artist.artist_name || 'Unknown artist';
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
