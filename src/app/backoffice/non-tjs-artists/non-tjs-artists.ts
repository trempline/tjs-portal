import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagArtist, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-non-tjs-artists',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe],
  templateUrl: './non-tjs-artists.html',
})
export class NonTjsArtists implements OnInit {
  private supabase = inject(SupabaseService);

  isLoading = true;
  searchTerm = '';
  artists: PagArtist[] = [];

  async ngOnInit() {
    this.artists = await this.supabase.getPagArtists();
    this.isLoading = false;
  }

  get filteredArtists(): PagArtist[] {
    const search = this.searchTerm.trim().toLowerCase();
    if (!search) {
      return this.artists;
    }

    return this.artists.filter((artist) => {
      const fullName = this.displayName(artist).toLowerCase();
      return fullName.includes(search)
        || (artist.email ?? '').toLowerCase().includes(search)
        || (artist.phone ?? '').toLowerCase().includes(search);
    });
  }

  get activeCount(): number {
    return this.artists.filter((artist) => artist.is_active).length;
  }

  displayName(artist: PagArtist): string {
    return `${artist.fname ?? ''} ${artist.lname ?? ''}`.trim() || 'Unknown artist';
  }

  avatarLetter(artist: PagArtist): string {
    return this.displayName(artist).charAt(0).toUpperCase();
  }

  statusLabel(artist: PagArtist): string {
    return artist.is_active ? 'Active' : 'Inactive';
  }

  statusClass(artist: PagArtist): string {
    return artist.is_active
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-zinc-100 text-zinc-600';
  }

  trackById(_: number, item: PagArtist): string {
    return item.id;
  }
}
