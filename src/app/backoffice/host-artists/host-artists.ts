import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, TjsArtist } from '../../services/supabase.service';

@Component({
  selector: 'app-host-artists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './host-artists.html',
})
export class HostArtists implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  artists: TjsArtist[] = [];

  async ngOnInit() {
    await this.loadData();
  }

  async openArtist(artist: TjsArtist) {
    await this.router.navigate(['/backoffice/host/artists', artist.id]);
  }

  displayName(artist: TjsArtist): string {
    return artist.profile?.full_name || artist.artist_name || '-';
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
        return 'bg-emerald-50 text-emerald-700';
      case 'inactive':
        return 'bg-zinc-100 text-zinc-600';
      default:
        return 'bg-amber-50 text-amber-700';
    }
  }

  trackByArtist(_: number, artist: TjsArtist) {
    return artist.id;
  }

  private async loadData() {
    this.isLoading = true;
    this.error = '';

    try {
      const artists = await this.supabase.getArtists();
      this.artists = artists
        .filter((artist) => artist.is_tjs_artist)
        .sort((left, right) => this.displayName(left).localeCompare(this.displayName(right)));
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artists could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }
}
