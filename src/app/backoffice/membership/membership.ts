import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MembershipPaymentRecord, SupabaseService, TjsRole, TjsUserWithRoles } from '../../services/supabase.service';

type MembershipFilter = 'all' | 'active' | 'expired' | 'non-member' | 'gated';

interface PaymentForm {
  paymentDate: string;
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

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  users: TjsUserWithRoles[] = [];
  payments: MembershipPaymentRecord[] = [];

  searchQuery = '';
  activeFilter: MembershipFilter = 'all';

  showPaymentModal = false;
  selectedUser: TjsUserWithRoles | null = null;
  paymentForm: PaymentForm = this.blankPaymentForm();

  async ngOnInit() {
    await this.loadData();
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get filteredUsers(): TjsUserWithRoles[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.users.filter((user) => {
      const status = this.membershipStatus(user);
      const matchesFilter =
        this.activeFilter === 'all' ||
        (this.activeFilter === 'active' && status === 'active') ||
        (this.activeFilter === 'expired' && status === 'expired') ||
        (this.activeFilter === 'non-member' && status === 'non-member') ||
        (this.activeFilter === 'gated' && this.isAccessBlocked(user));

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystacks = [
        user.full_name ?? '',
        user.email,
        this.membershipStatusLabel(user),
        user.roles.map((role) => role.name).join(' '),
      ];

      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }

  get activeCount(): number {
    return this.users.filter((user) => this.membershipStatus(user) === 'active').length;
  }

  get expiredCount(): number {
    return this.users.filter((user) => this.membershipStatus(user) === 'expired').length;
  }

  get nonMemberCount(): number {
    return this.users.filter((user) => this.membershipStatus(user) === 'non-member').length;
  }

  get gatedCount(): number {
    return this.users.filter((user) => this.isAccessBlocked(user)).length;
  }

  get paymentExpiryPreview(): string | null {
    if (!this.paymentForm.paymentDate) {
      return null;
    }

    const date = new Date(`${this.paymentForm.paymentDate}T00:00:00`);
    date.setFullYear(date.getFullYear() + 1);
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

    const [users, payments] = await Promise.all([
      this.supabase.listAllUsersWithRoles(),
      this.supabase.listMembershipPayments(),
    ]);

    this.users = users;
    this.payments = payments;
    this.isLoading = false;
  }

  setFilter(filter: MembershipFilter) {
    this.activeFilter = filter;
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

    this.isSaving = true;
    this.error = '';

    const result = await this.supabase.recordMembershipPayment(
      this.selectedUser.id,
      this.paymentForm.paymentDate,
      this.currentUserId
    );

    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Membership recorded for ${this.selectedUser.full_name || this.selectedUser.email}.`;
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
        return 'Non-Member';
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

  isAccessBlocked(user: TjsUserWithRoles): boolean {
    const hasWorkspaceRole = this.hasAnyRole(user, ['Artist', 'Host', 'Host+', 'Host Manager']);
    const isPrivileged = this.hasAnyRole(user, ['Admin', 'Committee Member']);
    return hasWorkspaceRole && !isPrivileged && this.membershipStatus(user) !== 'active';
  }

  accessStateLabel(user: TjsUserWithRoles): string {
    return this.isAccessBlocked(user) ? 'Blocked' : 'Allowed';
  }

  accessStateClass(user: TjsUserWithRoles): string {
    return this.isAccessBlocked(user)
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-blue-50 text-blue-700 border border-blue-200';
  }

  roleLabel(role: TjsRole): string {
    return role.name;
  }

  avatarLetter(user: TjsUserWithRoles): string {
    return (user.full_name || user.email).charAt(0).toUpperCase();
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  private hasAnyRole(user: TjsUserWithRoles, roleNames: string[]): boolean {
    return user.roles.some((role) => roleNames.includes(role.name));
  }

  private blankPaymentForm(): PaymentForm {
    return {
      paymentDate: this.todayDate(),
    };
  }

  private todayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
