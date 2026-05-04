import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  HostPlusExternalArtistItem,
  SupabaseService,
  TjsHost,
  TjsHostPlusDatabaseSettings,
} from '../../services/supabase.service';

@Component({
  selector: 'app-host-plus-artists',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './host-plus-artists.html',
})
export class HostPlusArtists implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  host: TjsHost | null = null;
  settings: TjsHostPlusDatabaseSettings | null = null;
  artists: HostPlusExternalArtistItem[] = [];
  sourceTable: 'artists' | 'tjs_artists' | null = null;
  searchQuery = '';
  isLoading = true;
  error = '';

  async ngOnInit() {
    await this.loadData();
  }

  get hostName(): string {
    return this.host?.public_name || this.host?.name || 'Host+';
  }

  get databaseLabel(): string {
    return this.settings?.database_label || this.settings?.supabase_url || 'No database configured';
  }

  get sourceLabel(): string {
    if (this.sourceTable === 'artists') {
      return 'External artists table';
    }

    if (this.sourceTable === 'tjs_artists') {
      return 'External tjs_artists table';
    }

    return 'No source loaded';
  }

  get activeCount(): number {
    return this.artists.filter((artist) => artist.is_active !== false).length;
  }

  get filteredArtists(): HostPlusExternalArtistItem[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.artists;
    }

    return this.artists.filter((artist) =>
      artist.display_name.toLowerCase().includes(query)
      || (artist.email ?? '').toLowerCase().includes(query)
      || (artist.phone ?? '').toLowerCase().includes(query)
    );
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    try {
      const host = await this.resolveCurrentHostPlus();
      this.host = host;

      if (!host) {
        this.error = 'No Host+ record is assigned to your account.';
        return;
      }

      const result = await this.supabase.getHostPlusExternalArtists(host.id);
      this.settings = result.settings;
      this.artists = result.items.sort((left, right) => left.display_name.localeCompare(right.display_name));
      this.sourceTable = result.source_table;

      if (result.error) {
        this.error = result.error;
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Host+ artists could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  statusClass(artist: HostPlusExternalArtistItem): string {
    return artist.is_active === false
      ? 'bg-zinc-100 text-zinc-600'
      : 'bg-emerald-50 text-emerald-700';
  }

  avatarLetter(artist: HostPlusExternalArtistItem): string {
    return artist.display_name.charAt(0).toUpperCase();
  }

  trackByArtist(_: number, artist: HostPlusExternalArtistItem) {
    return `${artist.source_table}:${artist.id}`;
  }

  private async resolveCurrentHostPlus(): Promise<TjsHost | null> {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      return null;
    }

    const hosts = await this.supabase.getMyHosts(profileId);
    return hosts.find((host) => host.is_host_plus) ?? null;
  }
}
