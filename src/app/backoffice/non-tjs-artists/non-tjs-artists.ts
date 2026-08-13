import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PagArtist, PagArtistPromotionTarget, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-non-tjs-artists',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './non-tjs-artists.html',
})
export class NonTjsArtists implements OnInit {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  searchTerm = '';
  instrumentFilter = '';
  error = '';
  successMessage = '';
  artists: PagArtist[] = [];
  private instrumentsByArtistId = new Map<string, string[]>();

  async ngOnInit() {
    this.artists = await this.supabase.getPagArtists();
    this.instrumentsByArtistId = await this.supabase.getPagArtistInstrumentNamesByArtistIds(
      this.artists.map((artist) => artist.id)
    );
    this.isLoading = false;
  }

  get filteredArtists(): PagArtist[] {
    return this.artists.filter((artist) =>
      this.matchesSearchTerm(artist) && this.matchesInstrumentFilter(artist)
    );
  }

  /** Instruments present in the loaded list, so the filter never offers an empty result. */
  get instrumentOptions(): string[] {
    const options = new Set<string>();

    for (const artist of this.artists) {
      for (const instrument of this.artistInstruments(artist)) {
        options.add(instrument);
      }
    }

    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || !!this.instrumentFilter;
  }

  clearFilters() {
    this.searchTerm = '';
    this.instrumentFilter = '';
  }

  artistInstruments(artist: PagArtist): string[] {
    return this.instrumentsByArtistId.get(String(artist.id)) ?? [];
  }

  instrumentsLabel(artist: PagArtist): string {
    return this.artistInstruments(artist).join(', ');
  }

  private matchesSearchTerm(artist: PagArtist): boolean {
    const terms = this.searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
      return true;
    }

    const haystack = [this.displayName(artist), artist.email ?? '', artist.phone ?? '']
      .join(' ')
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  }

  private matchesInstrumentFilter(artist: PagArtist): boolean {
    if (!this.instrumentFilter) {
      return true;
    }

    return this.artistInstruments(artist).includes(this.instrumentFilter);
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

  /** Host Managers browse this directory read-only; promoting belongs to Admins and Community Members. */
  get canManageArtists(): boolean {
    return this.authService.isAdmin || this.authService.isCommitteeMember;
  }

  get isHostManagerWorkspace(): boolean {
    return this.authService.isHostManager && this.router.url.includes('/host-manager/artists');
  }

  canPromote(artist: PagArtist): boolean {
    return this.canManageArtists && !!artist.is_active && !artist.tjs_artist_id;
  }

  async openArtistProfile(artist: PagArtist) {
    const workspaceRoot = this.isHostManagerWorkspace
      ? '/backoffice/host-manager/artists'
      : '/backoffice/artists';

    const target = artist.tjs_artist_id
      ? [this.isHostManagerWorkspace ? `${workspaceRoot}/tjs` : workspaceRoot, artist.tjs_artist_id]
      : [`${workspaceRoot}/non-tjs`, artist.id];

    await this.router.navigate(target);
  }

  typeBadges(artist: PagArtist): string[] {
    const badges = ['PAG'];

    if (this.isLinkedAsTjs(artist)) {
      badges.push('TJS');
    }

    if (artist.tjs_artist_is_invited) {
      badges.push('Invited');
    }

    return badges;
  }

  badgeClass(badge: string): string {
    switch (badge) {
      case 'TJS':
        return 'bg-blue-100 text-blue-700';
      case 'Invited':
        return 'bg-violet-100 text-violet-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  /** Older links predate the flag columns, so a linked record with no flags counts as TJS. */
  private isLinkedAsTjs(artist: PagArtist): boolean {
    return !!artist.tjs_artist_is_tjs
      || (!!artist.tjs_artist_id && !artist.tjs_artist_is_invited);
  }

  linkedArtistLabel(artist: PagArtist): string {
    if (!artist.tjs_artist_id) {
      return artist.is_active ? 'PAG only' : 'Inactive artist';
    }

    return this.isLinkedAsTjs(artist) ? 'Also TJS Artist' : 'Also Invited Artist';
  }

  async promote(event: Event, artist: PagArtist, target: PagArtistPromotionTarget) {
    event.stopPropagation();

    if (!this.canPromote(artist)) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const { artist: tjsArtist, error, invitationSent } = await this.supabase.promotePagArtist(
      artist,
      target,
      this.authService.currentUser?.id ?? null
    );

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.artists = this.artists.map((item) =>
      item.id === artist.id
        ? {
            ...item,
            tjs_artist_id: tjsArtist?.id ?? item.tjs_artist_id ?? 'linked',
            tjs_artist_is_tjs: target === 'tjs',
            tjs_artist_is_invited: target === 'invited',
          }
        : item
    );

    const roleLabel = target === 'invited' ? 'an invited artist' : 'a TJS artist';
    this.successMessage = invitationSent
      ? `${this.displayName(artist)} is now ${roleLabel}. An invitation email was sent to ${artist.email}.`
      : `${this.displayName(artist)} is now available as ${roleLabel}.`;
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 6000);
  }

  trackById(_: number, item: PagArtist): string {
    return item.id;
  }
}
