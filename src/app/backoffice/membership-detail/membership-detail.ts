import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MemberTier, MembershipPaymentRecord, SupabaseService, TjsUserWithRoles } from '../../services/supabase.service';

interface PaymentForm {
  amount: string;
  tier: string;
  paymentDate: string;
  durationDays: string;
}

@Component({
  selector: 'app-membership-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe, RouterLink],
  templateUrl: './membership-detail.html',
})
export class MembershipDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  member: TjsUserWithRoles | null = null;
  payments: MembershipPaymentRecord[] = [];
  memberTiers: MemberTier[] = [];
  paymentForm: PaymentForm = this.blankPaymentForm();
  showPaymentModal = false;
  showPasswordModal = false;
  passwordModalTitle = '';
  generatedTemporaryPassword = '';

  async ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.error = 'Public member not found.';
      this.isLoading = false;
      return;
    }

    await this.loadData(userId);
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get paymentExpiryPreview(): string | null {
    const durationDays = Number(this.paymentForm.durationDays);
    if (!this.paymentForm.paymentDate || !Number.isInteger(durationDays) || durationDays <= 0) {
      return null;
    }

    const baseDate = this.member?.member_until && new Date(`${this.member.member_until}T00:00:00`).getTime() > new Date(`${this.paymentForm.paymentDate}T00:00:00`).getTime()
      ? this.member.member_until
      : this.paymentForm.paymentDate;

    const date = new Date(`${baseDate}T00:00:00`);
    date.setDate(date.getDate() + durationDays);
    return date.toISOString().slice(0, 10);
  }

  get memberPayments(): MembershipPaymentRecord[] {
    if (!this.member) {
      return [];
    }

    return this.payments.filter((payment) => payment.profile_id === this.member!.id);
  }

  get membershipTierOptions(): string[] {
    return this.memberTiers.map((tier) => tier.name);
  }

  async loadData(userId: string) {
    this.isLoading = true;
    this.error = '';

    if (this.currentUserId) {
      const syncResult = await this.supabase.syncExpiredMemberships(this.currentUserId);
      if (syncResult.error) {
        this.error = syncResult.error;
      }
    }

    const [users, payments, memberTiers] = await Promise.all([
      this.supabase.listAllUsersWithRoles(),
      this.supabase.listMembershipPayments(1000),
      this.supabase.listMemberTiers(),
    ]);

    this.member = users.find((user) => user.id === userId && user.roles.some((role) => role.name === 'Public Member')) ?? null;
    this.payments = payments;
    this.memberTiers = memberTiers;

    if (!this.member && !this.error) {
      this.error = 'Public member not found.';
    }

    this.isLoading = false;
  }

  accountStatusLabel(user: TjsUserWithRoles): string {
    switch (user.account_status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      default:
        return 'Inactive';
    }
  }

  accountStatusClass(user: TjsUserWithRoles): string {
    switch (user.account_status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  membershipStatus(user: TjsUserWithRoles): 'active' | 'expired' | 'non-member' {
    if (!user.is_member) {
      return 'non-member';
    }

    if (!user.member_until) {
      return 'active';
    }

    return new Date(`${user.member_until}T00:00:00`).getTime() >= new Date(`${this.todayDate()}T00:00:00`).getTime()
      ? 'active'
      : 'expired';
  }

  membershipStatusLabel(user: TjsUserWithRoles): string {
    switch (this.membershipStatus(user)) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      default:
        return 'No Active Subscription';
    }
  }

  membershipStatusClass(user: TjsUserWithRoles): string {
    switch (this.membershipStatus(user)) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'expired':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  canActivateMemberAccount(user: TjsUserWithRoles): boolean {
    return user.account_status !== 'active';
  }

  async activateMemberAccount() {
    if (!this.member || !this.canActivateMemberAccount(this.member)) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const { temporaryPassword, error } = await this.supabase.activatePublicMemberAccount(this.member.id, this.member.full_name);
    if (error || !temporaryPassword) {
      this.error = error ?? 'The public member account could not be activated.';
      this.isSaving = false;
      return;
    }

    this.passwordModalTitle = 'Account Activated';
    this.generatedTemporaryPassword = temporaryPassword;
    this.showPasswordModal = true;
    this.successMessage = `${this.member.full_name || this.member.email} account is now active.`;
    await this.loadData(this.member.id);
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  async resetMemberPassword() {
    if (!this.member) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const { temporaryPassword, error } = await this.supabase.resetManagedUserPassword(this.member.id, this.member.full_name);
    if (error || !temporaryPassword) {
      this.error = error ?? 'The password could not be reset.';
      this.isSaving = false;
      return;
    }

    this.passwordModalTitle = this.member.account_status === 'active' ? 'Password Reset' : 'Password Set';
    this.generatedTemporaryPassword = temporaryPassword;
    this.showPasswordModal = true;
    this.successMessage = `Temporary password generated for ${this.member.full_name || this.member.email}.`;
    await this.loadData(this.member.id);
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  openPaymentModal() {
    this.paymentForm = this.blankPaymentForm();
    this.error = '';
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.passwordModalTitle = '';
    this.generatedTemporaryPassword = '';
  }

  async submitPayment() {
    if (!this.member || !this.currentUserId) {
      return;
    }

    const amount = Number(this.paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.error = 'Amount must be greater than 0.';
      return;
    }

    const durationDays = Number(this.paymentForm.durationDays);
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      this.error = 'Number of days must be greater than 0.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const result = await this.supabase.recordMembershipPayment(
      this.member.id,
      this.paymentForm.paymentDate,
      this.currentUserId,
      {
        amount,
        tier: this.paymentForm.tier,
        currency: 'EUR',
        durationDays,
      },
    );

    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Payment recorded for ${this.member.full_name || this.member.email}.`;
    this.closePaymentModal();
    await this.loadData(this.member.id);
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  async deletePayment(payment: MembershipPaymentRecord) {
    if (!this.member || !this.currentUserId) {
      return;
    }

    const confirmed = window.confirm('Delete this payment record? This will recalculate the member expiry.');
    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const result = await this.supabase.deleteMembershipPayment(payment.id, this.currentUserId);
    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Payment record deleted for ${payment.user_name || payment.user_email || 'member'}.`;
    await this.loadData(this.member.id);
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  private blankPaymentForm(): PaymentForm {
    return {
      amount: '',
      tier: this.membershipTierOptions[0] ?? 'TJS Member',
      paymentDate: this.todayDate(),
      durationDays: '30',
    };
  }

  private todayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
