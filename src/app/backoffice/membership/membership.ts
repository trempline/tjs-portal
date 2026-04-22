import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreatePublicMemberInput, MemberTier, MembershipPaymentRecord, SupabaseService, TjsUserWithRoles } from '../../services/supabase.service';

type MembershipFilter = 'all' | 'active' | 'expired' | 'non-member';

interface PaymentForm {
  amount: string;
  tier: string;
  paymentDate: string;
  durationDays: string;
}

interface PublicMemberForm {
  fullName: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './membership.html',
})
export class Membership implements OnInit {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  users: TjsUserWithRoles[] = [];
  payments: MembershipPaymentRecord[] = [];
  memberTiers: MemberTier[] = [];

  searchQuery = '';
  activeFilter: MembershipFilter = 'all';

  showPaymentModal = false;
  showCreateMemberModal = false;
  showPasswordModal = false;
  selectedUser: TjsUserWithRoles | null = null;
  paymentForm: PaymentForm = this.blankPaymentForm();
  publicMemberForm: PublicMemberForm = this.blankPublicMemberForm();
  passwordModalTitle = '';
  passwordModalMemberName = '';
  generatedTemporaryPassword = '';

  async ngOnInit() {
    await this.loadData();
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get publicMembers(): TjsUserWithRoles[] {
    return this.users.filter((user) => user.roles.some((role) => role.name === 'Public Member'));
  }

  get filteredUsers(): TjsUserWithRoles[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.publicMembers.filter((user) => {
      const status = this.membershipStatus(user);
      const matchesFilter =
        this.activeFilter === 'all' ||
        (this.activeFilter === 'active' && status === 'active') ||
        (this.activeFilter === 'expired' && status === 'expired') ||
        (this.activeFilter === 'non-member' && status === 'non-member');

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [user.full_name ?? '', user.email, this.membershipStatusLabel(user)]
        .some((value) => value.toLowerCase().includes(query));
    });
  }

  get activeCount(): number {
    return this.publicMembers.filter((user) => this.membershipStatus(user) === 'active').length;
  }

  get expiredCount(): number {
    return this.publicMembers.filter((user) => this.membershipStatus(user) === 'expired').length;
  }

  get nonMemberCount(): number {
    return this.publicMembers.filter((user) => this.membershipStatus(user) === 'non-member').length;
  }

  get filteredPayments(): MembershipPaymentRecord[] {
    const publicMemberIds = new Set(this.publicMembers.map((user) => user.id));
    return this.payments.filter((payment) => publicMemberIds.has(payment.profile_id));
  }

  get recentPayments(): MembershipPaymentRecord[] {
    return this.filteredPayments.slice(0, 5);
  }

  get membershipTierOptions(): string[] {
    return this.memberTiers.map((tier) => tier.name);
  }

  get paymentExpiryPreview(): string | null {
    const durationDays = Number(this.paymentForm.durationDays);
    if (!this.paymentForm.paymentDate || !Number.isInteger(durationDays) || durationDays <= 0) {
      return null;
    }

    const date = new Date(`${this.paymentForm.paymentDate}T00:00:00`);
    date.setDate(date.getDate() + durationDays);
    return date.toISOString().slice(0, 10);
  }

  async loadData() {
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
      this.supabase.listMembershipPayments(500),
      this.supabase.listMemberTiers(),
    ]);

    this.users = users;
    this.payments = payments;
    this.memberTiers = memberTiers;
    this.isLoading = false;
  }

  setFilter(filter: MembershipFilter) {
    this.activeFilter = filter;
  }

  openCreateMemberModal() {
    this.publicMemberForm = this.blankPublicMemberForm();
    this.error = '';
    this.showCreateMemberModal = true;
  }

  closeCreateMemberModal() {
    this.showCreateMemberModal = false;
  }

  async submitCreateMember() {
    if (!this.currentUserId) {
      return;
    }

    const payload: CreatePublicMemberInput = {
      email: this.publicMemberForm.email,
      full_name: this.publicMemberForm.fullName,
      phone: this.publicMemberForm.phone || null,
      assigned_by: this.currentUserId,
    };

    this.isSaving = true;
    this.error = '';

    const result = await this.supabase.createPublicMember(payload);
    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Public member created for ${payload.full_name}.`;
    this.closeCreateMemberModal();
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  openMemberDetail(user: TjsUserWithRoles) {
    void this.router.navigate(['/backoffice/membership', user.id]);
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

  canActivateMemberAccount(user: TjsUserWithRoles): boolean {
    return user.account_status !== 'active';
  }

  async activateMemberAccount(user: TjsUserWithRoles) {
    if (!this.canActivateMemberAccount(user)) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const { temporaryPassword, error } = await this.supabase.activatePublicMemberAccount(
      user.id,
      user.full_name,
    );

    if (error || !temporaryPassword) {
      this.error = error ?? 'The public member account could not be activated.';
      this.isSaving = false;
      return;
    }

    this.openPasswordModal('Account Activated', user, temporaryPassword);
    this.successMessage = `${user.full_name || user.email} account is now active.`;
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  async resetMemberPassword(user: TjsUserWithRoles) {
    this.isSaving = true;
    this.error = '';

    const { temporaryPassword, error } = await this.supabase.resetManagedUserPassword(
      user.id,
      user.full_name,
    );

    if (error || !temporaryPassword) {
      this.error = error ?? 'The password could not be reset.';
      this.isSaving = false;
      return;
    }

    this.openPasswordModal(user.account_status === 'active' ? 'Password Reset' : 'Password Set', user, temporaryPassword);
    this.successMessage = `Temporary password generated for ${user.full_name || user.email}.`;
    await this.loadData();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  openPaymentModal(user: TjsUserWithRoles) {
    this.selectedUser = user;
    this.paymentForm = this.blankPaymentForm();
    this.error = '';
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedUser = null;
  }

  async submitPayment() {
    if (!this.selectedUser || !this.currentUserId) {
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
      this.selectedUser.id,
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

    this.successMessage = `Payment recorded for ${this.selectedUser.full_name || this.selectedUser.email}.`;
    this.closePaymentModal();
    await this.loadData();
    this.isSaving = false;

    setTimeout(() => (this.successMessage = ''), 4000);
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

  avatarLetter(user: TjsUserWithRoles): string {
    return (user.full_name || user.email).charAt(0).toUpperCase();
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.passwordModalTitle = '';
    this.passwordModalMemberName = '';
    this.generatedTemporaryPassword = '';
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  private openPasswordModal(title: string, user: TjsUserWithRoles, temporaryPassword: string) {
    this.passwordModalTitle = title;
    this.passwordModalMemberName = user.full_name || user.email;
    this.generatedTemporaryPassword = temporaryPassword;
    this.showPasswordModal = true;
  }

  private blankPaymentForm(): PaymentForm {
    return {
      amount: '',
      tier: this.membershipTierOptions[0] ?? 'TJS Member',
      paymentDate: this.todayDate(),
      durationDays: '30',
    };
  }

  private blankPublicMemberForm(): PublicMemberForm {
    return {
      fullName: '',
      email: '',
      phone: '',
    };
  }

  private todayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
