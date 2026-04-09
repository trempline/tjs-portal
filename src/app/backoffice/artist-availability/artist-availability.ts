import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistAvailabilityEntry,
  SupabaseService,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-availability',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe],
  templateUrl: './artist-availability.html',
})
export class ArtistAvailability implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  isEditing = false;
  error = '';
  successMessage = '';

  entries: ArtistAvailabilityEntry[] = [];

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist availability could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadEntries(profileId);
  }

  startEditing() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
    if (this.entries.length === 0) {
      this.entries = [this.blankEntry()];
    }
  }

  cancelEditing() {
    void this.reload();
  }

  addEntry() {
    if (!this.isEditing) {
      return;
    }

    this.entries = [...this.entries, this.blankEntry()];
  }

  removeEntry(index: number) {
    if (!this.isEditing) {
      return;
    }

    this.entries = this.entries.filter((_, itemIndex) => itemIndex !== index);
    if (this.entries.length === 0) {
      this.entries = [this.blankEntry()];
    }
  }

  async save() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist availability could not be saved.';
      return;
    }

    this.error = '';
    this.successMessage = '';

    const invalidRange = this.entries.find((entry) => entry.start_date && entry.end_date && entry.end_date < entry.start_date);
    if (invalidRange) {
      this.error = 'End date must be on or after start date.';
      return;
    }

    this.isSaving = true;
    const error = await this.supabase.saveArtistWorkspaceAvailability(profileId, this.entries);
    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Artist availability saved successfully.';
      this.isEditing = false;
      await this.loadEntries(profileId);
    }
    this.isSaving = false;
  }

  getDays(entry: ArtistAvailabilityEntry): number {
    if (!entry.start_date || !entry.end_date) {
      return 0;
    }

    const start = new Date(`${entry.start_date}T00:00:00`);
    const end = new Date(`${entry.end_date}T00:00:00`);
    const diffMs = end.getTime() - start.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
      return 0;
    }

    return Math.floor(diffMs / 86400000) + 1;
  }

  trackByIndex(index: number) {
    return index;
  }

  private blankEntry(): ArtistAvailabilityEntry {
    return {
      start_date: '',
      end_date: '',
      note: '',
    };
  }

  private async reload() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist availability could not be loaded.';
      return;
    }

    this.isEditing = false;
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    await this.loadEntries(profileId);
  }

  private async loadEntries(profileId: string) {
    this.entries = await this.supabase.getArtistWorkspaceAvailability(profileId);
    this.isLoading = false;
  }
}
