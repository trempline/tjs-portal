import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicTjsArtistDetail, SupabaseService } from '../services/supabase.service';
import { SharedModule } from '../shared/shared-module';

@Component({
  selector: 'app-public-artist-detail',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor],
  templateUrl: './public-artist-detail.html',
})
export class PublicArtistDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  artist: PublicTjsArtistDetail | null = null;

  async ngOnInit() {
    const artistId = this.route.snapshot.paramMap.get('id');
    if (!artistId) {
      this.error = 'Artist not found.';
      this.isLoading = false;
      return;
    }

    try {
      this.artist = await this.supabase.getPublicTjsArtistDetail(artistId);
      if (!this.artist) {
        this.error = 'Artist not found.';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/artists']);
  }

  openEvent(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }

  get heroEyebrow(): string {
    return this.artist?.performance_types[0] || 'Artist';
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'TJS';
    }

    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  instrumentsLabel(): string {
    return this.artist?.instruments.length ? this.artist.instruments.join(', ') : 'No instruments listed yet';
  }

  formatHosts(names: string[]): string {
    if (names.length === 0) {
      return 'Host to be announced';
    }

    if (names.length === 1) {
      return names[0];
    }

    return names.join(', ');
  }

  performanceTypesLabel(): string {
    return this.artist?.performance_types.length ? this.artist.performance_types.join(', ') : 'Performance type TBA';
  }

  mediaUrl(item: PublicTjsArtistDetail['media'][number]): string {
    return item.urls[0] ?? '';
  }

  formatScheduleLine(line: string): string {
    const { datePart, timePart, locationPart } = this.parseScheduleLine(line);
    return [datePart, timePart, locationPart].filter(Boolean).join(' - ');
  }

  private parseScheduleLine(line: string): { datePart: string; timePart: string; locationPart: string } {
    const parts = line.split('|').map((part) => part.trim());
    const dateTimePart = parts[0] || '';
    const locationPart = parts[1] || '';
    const separatorIndex = dateTimePart.lastIndexOf(' : ');

    return {
      datePart: separatorIndex >= 0 ? dateTimePart.slice(0, separatorIndex).trim() : dateTimePart,
      timePart: separatorIndex >= 0 ? dateTimePart.slice(separatorIndex + 3).trim() : '',
      locationPart,
    };
  }
}
