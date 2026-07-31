import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ImageCopyrightTag } from '../../shared/image-copyright/image-copyright-tag';
import { isPublicArtistProfileComplete } from '../../shared/artist-profile/artist-public-profile.util';
import { AuthService } from '../../services/auth.service';
import {
  ArtistMediaEntry,
  ArtistWorkspaceProfile,
  SupabaseService,
} from '../../services/supabase.service';

export interface PreviewDevice {
  key: 'mobile' | 'tablet' | 'desktop';
  label: string;
  /** CSS pixel viewport the page is rendered at. */
  width: number;
  height: number;
  hint: string;
}

const DEVICES: PreviewDevice[] = [
  { key: 'mobile', label: 'Mobile', width: 390, height: 844, hint: '390 × 844' },
  { key: 'tablet', label: 'Tablet', width: 834, height: 1112, hint: '834 × 1112' },
  { key: 'desktop', label: 'Desktop', width: 1440, height: 900, hint: '1440 × 900' },
];

/** Widest the preview stage may get before the frame is scaled down to fit. */
const STAGE_MAX_WIDTH = 960;

@Component({
  selector: 'app-artist-preview',
  standalone: true,
  imports: [NgIf, NgFor, ImageCopyrightTag],
  templateUrl: './artist-preview.html',
})
export class ArtistPreview implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);

  readonly devices = DEVICES;

  isLoading = true;
  error = '';
  activeDevice: PreviewDevice = DEVICES[0];

  /** Set when the artist's public page can actually be rendered. */
  publicUrl = '';
  previewUrl: SafeResourceUrl | null = null;
  /** Bumped to force the iframe to reload. */
  reloadToken = 0;

  /** Why the live page cannot be shown — empty when it can. */
  unavailableReasons: string[] = [];

  profile: ArtistWorkspaceProfile | null = null;
  mediaEntries: ArtistMediaEntry[] = [];

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Preview could not be loaded.';
      this.isLoading = false;
      return;
    }

    try {
      await this.load(profileId);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Preview could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  selectDevice(device: PreviewDevice) {
    this.activeDevice = device;
  }

  get isLivePreview(): boolean {
    return !!this.previewUrl;
  }

  /** Shrinks the device frame so it fits the stage without clipping. */
  get scale(): number {
    return Math.min(1, STAGE_MAX_WIDTH / this.activeDevice.width);
  }

  get scalePercent(): number {
    return Math.round(this.scale * 100);
  }

  get stageWidth(): number {
    return Math.round(this.activeDevice.width * this.scale);
  }

  get stageHeight(): number {
    return Math.round(this.activeDevice.height * this.scale);
  }

  get bannerImageUrl(): string | null {
    return this.profile?.banner_url ?? this.profile?.profile_picture_url ?? null;
  }

  get displayName(): string {
    const name = `${this.profile?.first_name ?? ''} ${this.profile?.last_name ?? ''}`.trim();
    return name || this.authService.displayName;
  }

  get mediaWithCovers(): ArtistMediaEntry[] {
    return this.mediaEntries.filter((entry) => !!entry.image_url);
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'TJS';
    }

    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  reloadPreview() {
    if (!this.publicUrl) {
      return;
    }

    this.reloadToken += 1;
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.publicUrl}?preview=${this.reloadToken}`
    );
  }

  openInNewTab() {
    if (this.publicUrl) {
      window.open(this.publicUrl, '_blank', 'noopener');
    }
  }

  private async load(profileId: string) {
    const [profile, mediaEntries, instruments, artistRecord] = await Promise.all([
      this.supabase.getArtistWorkspaceProfile(profileId),
      this.supabase.getArtistWorkspaceMedia(profileId),
      this.supabase.getArtistWorkspaceInstruments(profileId),
      this.supabase.getArtistRecordForProfile(profileId),
    ]);

    this.profile = profile;
    this.mediaEntries = mediaEntries;

    const reasons: string[] = [];

    if (!artistRecord?.is_tjs_artist) {
      reasons.push('Only TJS artists have a public page. Invited artists are not listed on the website.');
    }

    if (!isPublicArtistProfileComplete({
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      instruments: instruments.map((instrument) => instrument.name),
    })) {
      if (!profile?.first_name?.trim() || !profile?.last_name?.trim()) {
        reasons.push('Add your first name and last name on the Profile page.');
      }

      if (instruments.length === 0) {
        reasons.push('Add at least one instrument on the Instruments page.');
      }
    }

    this.unavailableReasons = reasons;

    if (reasons.length === 0 && artistRecord?.is_tjs_artist) {
      this.publicUrl = `/artists/${artistRecord.id}`;
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.publicUrl);
    }
  }
}
