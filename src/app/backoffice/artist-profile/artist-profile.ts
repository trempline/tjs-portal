import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceEditActions } from '../../shared/workspace-edit/workspace-edit-actions';
import {
  MAX_ARTIST_LONG_BIOGRAPHY_LENGTH,
  MAX_ARTIST_SHORT_BIOGRAPHY_LENGTH,
  MAX_ARTIST_TAGLINE_LENGTH,
  remainingCharacters,
} from '../../shared/artist-biography/artist-biography.util';
import { displayCopyrightText, MAX_COPYRIGHT_TEXT_LENGTH } from '../../shared/image-copyright/image-copyright.util';
import { ImageCopyrightTag } from '../../shared/image-copyright/image-copyright-tag';
import { CroppedImageResult, ImageCropperModal } from '../../shared/image-cropper/image-cropper-modal';
import { ImagePreviewOpen } from '../../shared/image-preview/image-preview-open';
import {
  ArtistAwardEntry,
  ArtistEducationEntry,
  ArtistPerformanceType,
  ArtistWorkspaceProfile,
  SupabaseService,
} from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

/** Lower-cased labels that identify the classical entry in sys_artist_performance. */
const CLASSICAL_PERFORMANCE_LABELS = [
  'classical music',
  'classical',
  'musique classique',
  'classique',
];

@Component({
  selector: 'app-artist-profile',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, WorkspaceEditActions, ImageCopyrightTag, ImageCropperModal, ImagePreviewOpen],
  templateUrl: './artist-profile.html',
})
export class ArtistProfile implements OnInit {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  isSaving = false;
  isUploadingBanner = false;
  isUploadingAvatar = false;
  isEditing = false;
  error = '';
  successMessage = '';

  performanceOptions: ArtistPerformanceType[] = [];
  /** Artists in this workspace always perform classical music — the type is not theirs to pick. */
  lockedPerformanceType: ArtistPerformanceType | null = null;
  cropperTarget: 'avatar' | 'banner' | null = null;

  profile: ArtistWorkspaceProfile = this.blankProfile('');

  readonly maxTaglineLength = MAX_ARTIST_TAGLINE_LENGTH;
  readonly maxShortBiographyLength = MAX_ARTIST_SHORT_BIOGRAPHY_LENGTH;
  readonly maxLongBiographyLength = MAX_ARTIST_LONG_BIOGRAPHY_LENGTH;
  readonly maxCopyrightLength = MAX_COPYRIGHT_TEXT_LENGTH;

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist profile could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadProfile(profileId);
  }

  blankProfile(profileId: string): ArtistWorkspaceProfile {
    return {
      profile_id: profileId,
      banner_url: null,
      banner_copyright: '',
      profile_picture_url: null,
      profile_picture_copyright: '',
      first_name: '',
      last_name: '',
      tagline: '',
      short_biography: '',
      long_biography: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      country: '',
      performance_types: [],
      educations: [this.blankEducation()],
      awards: [this.blankAward()],
    };
  }

  blankEducation(): ArtistEducationEntry {
    return {
      school_name: '',
      course_name: '',
      year: null,
    };
  }

  blankAward(): ArtistAwardEntry {
    return {
      award: '',
      description: '',
      year: null,
    };
  }

  addEducation() {
    this.profile.educations = [...this.profile.educations, this.blankEducation()];
  }

  removeEducation(index: number) {
    this.profile.educations = this.profile.educations.filter((_, itemIndex) => itemIndex !== index);
    if (this.profile.educations.length === 0) {
      this.profile.educations = [this.blankEducation()];
    }
  }

  addAward() {
    this.profile.awards = [...this.profile.awards, this.blankAward()];
  }

  removeAward(index: number) {
    this.profile.awards = this.profile.awards.filter((_, itemIndex) => itemIndex !== index);
    if (this.profile.awards.length === 0) {
      this.profile.awards = [this.blankAward()];
    }
  }

  openBannerEditor() {
    if (!this.isEditing) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.cropperTarget = 'banner';
  }

  openAvatarEditor() {
    if (!this.isEditing) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.cropperTarget = 'avatar';
  }

  closeImageEditor() {
    this.cropperTarget = null;
  }

  async onCroppedImageSaved(result: CroppedImageResult) {
    const target = this.cropperTarget;
    if (!target) {
      return;
    }

    this.error = '';
    this.successMessage = '';

    const isBanner = target === 'banner';
    if (isBanner) {
      this.isUploadingBanner = true;
    } else {
      this.isUploadingAvatar = true;
    }

    const { url, error } = await this.supabase.uploadArtistWorkspaceImage(
      this.profile.profile_id,
      result.file,
      isBanner ? 'banner' : 'avatar',
    );

    if (error) {
      this.error = error;
    } else {
      if (isBanner) {
        this.profile.banner_url = url;
        this.profile.banner_copyright = result.copyright;
      } else {
        this.profile.profile_picture_url = url;
        this.profile.profile_picture_copyright = result.copyright;
      }

      await this.persistUploadedImage(isBanner ? 'banner' : 'profile picture');
    }

    // Closed either way so the page-level message is not hidden behind the modal.
    this.cropperTarget = null;
    this.isUploadingBanner = false;
    this.isUploadingAvatar = false;
  }

  async saveProfile() {
    this.error = '';
    this.successMessage = '';

    if (!this.profile.first_name.trim() || !this.profile.last_name.trim()) {
      this.error = 'First name and last name are required.';
      return;
    }

    if (!this.profile.email.trim()) {
      this.error = 'Email is required.';
      return;
    }

    this.applyLockedPerformanceType();

    this.isSaving = true;
    const error = await this.supabase.saveArtistWorkspaceProfile(this.profile);
    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Artist profile saved successfully.';
      this.isEditing = false;
    }
    this.isSaving = false;
  }

  trackByPerformance(_: number, item: ArtistPerformanceType) {
    return item.id;
  }

  trackByIndex(index: number) {
    return index;
  }

  charsLeft(text: string | null | undefined, maxLength: number): number {
    return remainingCharacters(text, maxLength);
  }

  /** Credit shown under the avatar — the circle is too small for an on-image overlay. */
  get pictureCopyrightLabel(): string {
    return displayCopyrightText(this.profile.profile_picture_copyright);
  }

  private async loadProfile(profileId: string) {
    this.error = '';

    const [profile, performanceOptions] = await Promise.all([
      this.supabase.getArtistWorkspaceProfile(profileId),
      this.supabase.listArtistPerformanceTypes(),
    ]);

    this.performanceOptions = performanceOptions;
    this.profile = profile ?? this.blankProfile(profileId);
    this.lockedPerformanceType = this.resolveClassicalPerformanceType(performanceOptions);
    this.applyLockedPerformanceType();
    this.isLoading = false;
  }

  /**
   * Finds the classical entry in the system list. Matched by name rather than a hard-coded
   * id, and tolerant of the French labels, since the list is maintained in the database.
   */
  private resolveClassicalPerformanceType(options: ArtistPerformanceType[]): ArtistPerformanceType | null {
    const normalize = (value: string) => value.toLowerCase().trim();

    return options.find((option) => CLASSICAL_PERFORMANCE_LABELS.includes(normalize(option.name ?? '')))
      ?? options.find((option) => normalize(option.name ?? '').includes('classi'))
      ?? null;
  }

  /** Keeps the saved profile in step with the locked type without touching other data. */
  private applyLockedPerformanceType() {
    if (!this.lockedPerformanceType) {
      return;
    }

    this.profile.performance_types = [this.lockedPerformanceType];
  }

  private async persistUploadedImage(label: 'banner' | 'profile picture') {
    const error = await this.supabase.saveArtistWorkspaceProfile(this.profile);
    if (error) {
      this.error = error;
      return;
    }

    this.successMessage = `Artist ${label} saved successfully.`;
  }

  startEditing() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  cancelEditing() {
    void this.reloadProfile();
  }

  private async reloadProfile() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = false;
    this.isLoading = true;
    this.cropperTarget = null;

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist profile could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadProfile(profileId);
  }
}
