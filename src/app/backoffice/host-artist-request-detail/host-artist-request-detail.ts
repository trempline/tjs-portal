import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, Location, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArtistRequestDetail, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-host-artist-request-detail',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  templateUrl: './host-artist-request-detail.html',
})
export class HostArtistRequestDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private location = inject(Location);

  isLoading = true;
  error = '';
  request: ArtistRequestDetail | null = null;

  async ngOnInit() {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (!requestId) {
      this.error = 'Request not found.';
      this.isLoading = false;
      return;
    }

    try {
      this.request = await this.supabase.getArtistWorkspaceRequestDetail(requestId);
      if (!this.request) {
        this.error = 'Request details could not be loaded.';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Request details could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  primaryArtistName(): string {
    return this.request?.artists.find((artist) => artist.is_primary)?.display_name
      || this.request?.artists[0]?.display_name
      || 'Unassigned';
  }

  trackByOptionalId(_: number, item: { id?: string }) {
    return item.id ?? _;
  }
}
