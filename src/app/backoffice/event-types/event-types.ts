import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventTypeOption, SupabaseService } from '../../services/supabase.service';

interface EventTypeForm {
  name: string;
}

@Component({
  selector: 'app-event-types',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './event-types.html',
})
export class EventTypes implements OnInit {
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';
  showModal = false;
  editingId: number | null = null;
  form: EventTypeForm = this.blankForm();
  eventTypes: EventTypeOption[] = [];

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';
    this.eventTypes = await this.supabase.listEventTypeOptions();
    this.isLoading = false;
  }

  openCreateModal() {
    this.editingId = null;
    this.form = this.blankForm();
    this.error = '';
    this.showModal = true;
  }

  openEditModal(item: EventTypeOption) {
    this.editingId = item.id;
    this.form = { name: item.name };
    this.error = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async submit() {
    this.isSaving = true;
    this.error = '';

    const result = this.editingId === null
      ? await this.supabase.createEventType(this.form.name)
      : { error: await this.supabase.updateEventType(this.editingId, this.form.name) };

    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = this.editingId === null ? 'Event type created.' : 'Event type updated.';
    this.closeModal();
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  async delete(item: EventTypeOption) {
    const confirmed = window.confirm(`Delete event type "${item.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.error = '';
    const error = await this.supabase.deleteEventType(item.id);
    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.successMessage = 'Event type deleted.';
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  trackById(_: number, item: { id: number }) {
    return item.id;
  }

  private blankForm(): EventTypeForm {
    return { name: '' };
  }
}
