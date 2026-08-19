import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HostWorkspaceEventDetail, PublicLocationDetail, SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-artist-event-detail',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe],
  templateUrl: './artist-event-detail.html',
})
export class ArtistEventDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  error = '';
  event: HostWorkspaceEventDetail | null = null;
  /** The venue in full: playing here entitles the artist to what the website never shows. */
  venue: PublicLocationDetail | null = null;

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    const eventId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!profileId || !eventId) {
      this.error = 'Event details could not be loaded.';
      this.isLoading = false;
      return;
    }

    try {
      this.event = await this.supabase.getArtistWorkspaceEventDetail(profileId, eventId);
      if (!this.event) {
        this.error = 'Event details could not be loaded.';
        return;
      }

      if (this.event.location_id) {
        this.venue = await this.supabase.getLocationDetailForViewer(this.event.location_id, profileId);
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Event details could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Active';
      case 'SELECTED':
        return 'Inactive';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  get detailTeaser(): string {
    return this.event?.request_detail?.teaser || this.event?.description || 'No teaser available.';
  }

  get venueMapUrl(): string | null {
    if (typeof this.venue?.lat !== 'number' || typeof this.venue?.long !== 'number') {
      return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${this.venue.lat},${this.venue.long}`;
  }
}
