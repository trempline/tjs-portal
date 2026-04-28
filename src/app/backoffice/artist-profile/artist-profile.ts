import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ArtistAwardEntry,
  ArtistEducationEntry,
  ArtistPerformanceType,
  ArtistWorkspaceProfile,
  SupabaseService,
} from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-artist-profile',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
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
  selectedPerformanceId = '';

  profile: ArtistWorkspaceProfile = this.blankProfile('');

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
      profile_picture_url: null,
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

  addPerformanceType() {
    const performanceId = Number(this.selectedPerformanceId);
    if (!performanceId) return;

    const selected = this.performanceOptions.find((option) => option.id === performanceId);
    if (!selected) return;

    if (!this.profile.performance_types.some((item) => item.id === selected.id)) {
      this.profile.performance_types = [...this.profile.performance_types, selected];
    }

    this.selectedPerformanceId = '';
  }

  removePerformanceType(performanceId: number) {
    this.profile.performance_types = this.profile.performance_types.filter((item) => item.id !== performanceId);
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

  async onBannerSelected(event: Event) {
    if (!this.isEditing) {
      return;
    }

    this.error = '';
    this.successMessage = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingBanner = true;
    const { url, error } = await this.supabase.uploadArtistWorkspaceImage(this.profile.profile_id, file, 'banner');
    if (error) {
      this.error = error;
    } else {
      this.profile.banner_url = url;
      await this.persistUploadedImage('banner');
    }
    this.isUploadingBanner = false;
    input.value = '';
  }

  async onAvatarSelected(event: Event) {
    if (!this.isEditing) {
      return;
    }

    this.error = '';
    this.successMessage = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingAvatar = true;
    const { url, error } = await this.supabase.uploadArtistWorkspaceImage(this.profile.profile_id, file, 'avatar');
    if (error) {
      this.error = error;
    } else {
      this.profile.profile_picture_url = url;
      await this.persistUploadedImage('profile picture');
    }
    this.isUploadingAvatar = false;
    input.value = '';
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

  private async loadProfile(profileId: string) {
    this.error = '';

    const [profile, performanceOptions] = await Promise.all([
      this.supabase.getArtistWorkspaceProfile(profileId),
      this.supabase.listArtistPerformanceTypes(),
    ]);

    this.performanceOptions = performanceOptions;
    this.profile = profile ?? this.blankProfile(profileId);
    this.isLoading = false;
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

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist profile could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadProfile(profileId);
  }
}
