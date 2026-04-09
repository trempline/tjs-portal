import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistInstrumentOption,
  SupabaseService,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-instruments',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './artist-instruments.html',
})
export class ArtistInstruments implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  isEditing = false;
  error = '';
  successMessage = '';

  instrumentOptions: ArtistInstrumentOption[] = [];
  selectedInstrumentId = '';
  selectedInstruments: ArtistInstrumentOption[] = [];

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist instruments could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadData(profileId);
  }

  async save() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist instruments could not be saved.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const error = await this.supabase.saveArtistWorkspaceInstruments(profileId, this.selectedInstruments);
    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Artist instruments saved successfully.';
      this.isEditing = false;
    }

    this.isSaving = false;
  }

  addInstrument() {
    if (!this.isEditing) {
      return;
    }

    const instrumentId = Number(this.selectedInstrumentId);
    if (!instrumentId) {
      return;
    }

    const selected = this.instrumentOptions.find((option) => option.id === instrumentId);
    if (!selected) {
      return;
    }

    if (!this.selectedInstruments.some((item) => item.id === selected.id)) {
      this.selectedInstruments = [...this.selectedInstruments, selected];
    }

    this.selectedInstrumentId = '';
  }

  removeInstrument(instrumentId: number) {
    if (!this.isEditing) {
      return;
    }

    this.selectedInstruments = this.selectedInstruments.filter((item) => item.id !== instrumentId);
  }

  startEditing() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  cancelEditing() {
    void this.reload();
  }

  trackByInstrument(_: number, item: ArtistInstrumentOption) {
    return item.id;
  }

  private async reload() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist instruments could not be loaded.';
      return;
    }

    this.isEditing = false;
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    await this.loadData(profileId);
  }

  private async loadData(profileId: string) {
    const [instrumentOptions, selectedInstruments] = await Promise.all([
      this.supabase.listArtistInstrumentOptions(),
      this.supabase.getArtistWorkspaceInstruments(profileId),
    ]);

    this.instrumentOptions = instrumentOptions;
    this.selectedInstruments = selectedInstruments;
    this.selectedInstrumentId = '';
    this.isLoading = false;
  }
}
