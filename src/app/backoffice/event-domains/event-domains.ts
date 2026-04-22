import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface DomainForm {
  name: string;
}

@Component({
  selector: 'app-event-domains',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './event-domains.html',
})
export class EventDomains implements OnInit {
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';
  showModal = false;
  editingId: number | null = null;
  form: DomainForm = this.blankForm();
  domains: Array<{ id: number; name: string }> = [];

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';
    this.domains = await this.supabase.listEventDomains();
    this.isLoading = false;
  }

  openCreateModal() {
    this.editingId = null;
    this.form = this.blankForm();
    this.error = '';
    this.showModal = true;
  }

  openEditModal(item: { id: number; name: string }) {
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
      ? await this.supabase.createEventDomain(this.form.name)
      : { error: await this.supabase.updateEventDomain(this.editingId, this.form.name) };

    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = this.editingId === null ? 'Domain created.' : 'Domain updated.';
    this.closeModal();
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  async delete(item: { id: number; name: string }) {
    const confirmed = window.confirm(`Delete domain "${item.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.error = '';
    const error = await this.supabase.deleteEventDomain(item.id);
    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.successMessage = 'Domain deleted.';
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  trackById(_: number, item: { id: number }) {
    return item.id;
  }

  private blankForm(): DomainForm {
    return { name: '' };
  }
}
