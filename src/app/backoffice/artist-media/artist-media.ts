import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistMediaEntry,
  ArtistMediaType,
  SupabaseService,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-media',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './artist-media.html',
})
export class ArtistMedia implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  isEditing = false;
  uploadingKey: string | null = null;
  error = '';
  successMessage = '';

  mediaEntries: ArtistMediaEntry[] = [];

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist media could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadMedia(profileId);
  }

  get videos(): ArtistMediaEntry[] {
    return this.mediaEntries.filter((entry) => entry.media_type === 'video');
  }

  get cds(): ArtistMediaEntry[] {
    return this.mediaEntries.filter((entry) => entry.media_type === 'cd');
  }

  startEditing() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  cancelEditing() {
    void this.reload();
  }

  addMedia(mediaType: ArtistMediaType) {
    if (!this.isEditing) {
      return;
    }

    this.mediaEntries = [...this.mediaEntries, this.blankMedia(mediaType)];
  }

  removeMedia(index: number, mediaType: ArtistMediaType) {
    if (!this.isEditing) {
      return;
    }

    const target = this.getEntries(mediaType)[index];
    if (!target) {
      return;
    }

    this.mediaEntries = this.mediaEntries.filter((entry) => entry !== target);
  }

  addUrl(media: ArtistMediaEntry) {
    if (!this.isEditing) {
      return;
    }

    media.urls = [...media.urls, ''];
  }

  removeUrl(media: ArtistMediaEntry, urlIndex: number) {
    if (!this.isEditing) {
      return;
    }

    media.urls = media.urls.filter((_, index) => index !== urlIndex);
    if (media.urls.length === 0) {
      media.urls = [''];
    }
  }

  async onImageSelected(event: Event, media: ArtistMediaEntry, mediaType: ArtistMediaType, index: number) {
    if (!this.isEditing) {
      return;
    }

    this.error = '';
    this.successMessage = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist media could not be saved.';
      return;
    }

    this.uploadingKey = `${mediaType}-${index}`;
    const { url, error } = await this.supabase.uploadArtistWorkspaceMediaImage(profileId, file);
    if (error) {
      this.error = error;
    } else {
      media.image_url = url;
    }

    this.uploadingKey = null;
    input.value = '';
  }

  async save() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist media could not be saved.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const error = await this.supabase.saveArtistWorkspaceMedia(profileId, this.mediaEntries);
    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Artist media saved successfully.';
      this.isEditing = false;
      await this.loadMedia(profileId);
    }

    this.isSaving = false;
  }

  trackByIndex(index: number) {
    return index;
  }

  isUploading(mediaType: ArtistMediaType, index: number): boolean {
    return this.uploadingKey === `${mediaType}-${index}`;
  }

  private blankMedia(mediaType: ArtistMediaType): ArtistMediaEntry {
    return {
      media_type: mediaType,
      image_url: null,
      name: '',
      description: '',
      urls: [''],
    };
  }

  private getEntries(mediaType: ArtistMediaType): ArtistMediaEntry[] {
    return this.mediaEntries.filter((entry) => entry.media_type === mediaType);
  }

  private async reload() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist media could not be loaded.';
      return;
    }

    this.isEditing = false;
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    await this.loadMedia(profileId);
  }

  private async loadMedia(profileId: string) {
    this.mediaEntries = await this.supabase.getArtistWorkspaceMedia(profileId);
    this.isLoading = false;
  }
}
