import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberTier, SupabaseService } from '../../services/supabase.service';

interface MemberTierForm {
  name: string;
  description: string;
}

@Component({
  selector: 'app-member-tiers',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe],
  templateUrl: './member-tiers.html',
})
export class MemberTiers implements OnInit {
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';
  showCreateModal = false;

  tiers: MemberTier[] = [];
  form: MemberTierForm = this.blankForm();

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';
    this.tiers = await this.supabase.listMemberTiers();
    this.isLoading = false;
  }

  openCreateModal() {
    this.form = this.blankForm();
    this.error = '';
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async submit() {
    this.isSaving = true;
    this.error = '';

    const result = await this.supabase.createMemberTier({
      name: this.form.name,
      description: this.form.description,
    });

    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Member tier ${this.form.name.trim()} created.`;
    this.closeCreateModal();
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  trackById(_: number, item: { id: number }) {
    return item.id;
  }

  private blankForm(): MemberTierForm {
    return {
      name: '',
      description: '',
    };
  }
}
