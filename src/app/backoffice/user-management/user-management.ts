import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService, TjsRole, TjsUserWithRoles } from '../../services/supabase.service';

type UserTab = 'all' | 'admins' | 'committee' | 'members';

interface InviteForm {
  email: string;
  fullName: string;
  phone: string;
  roleId: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './user-management.html',
})
export class UserManagement implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  users: TjsUserWithRoles[] = [];
  allRoles: TjsRole[] = [];
  activeTab: UserTab = 'all';

  showInviteModal = false;
  showEditModal = false;
  showRoleModal = false;

  selectedUser: TjsUserWithRoles | null = null;

  inviteForm: InviteForm = this.blankInvite();
  editForm: Partial<TjsUserWithRoles> = {};

  roleModalRoles: { role: TjsRole; assigned: boolean }[] = [];

  setTab(key: string) {
    this.activeTab = key as UserTab;
  }

  private hasRole(user: TjsUserWithRoles, roleName: string): boolean {
    return user.roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());
  }

  get filteredUsers(): TjsUserWithRoles[] {
    switch (this.activeTab) {
      case 'admins':
        return this.users.filter((u) => this.hasRole(u, 'admin'));
      case 'committee':
        return this.users.filter((u) => this.hasRole(u, 'committee member'));
      case 'members':
        return this.users.filter((u) => this.hasRole(u, 'member'));
      default:
        return this.users;
    }
  }

  get adminCount() {
    return this.users.filter((u) => this.hasRole(u, 'admin')).length;
  }

  get committeeCount() {
    return this.users.filter((u) => this.hasRole(u, 'committee member')).length;
  }

  get memberCount() {
    return this.users.filter((u) => this.hasRole(u, 'member')).length;
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    this.isLoading = true;
    this.error = '';
    const [users, roles] = await Promise.all([
      this.supabase.listAllUsersWithRoles(),
      this.supabase.getAllRoles(),
    ]);
    this.users = users;
    this.allRoles = roles;
    this.isLoading = false;
  }

  openInviteModal() {
    this.inviteForm = this.blankInvite();
    this.error = '';
    this.successMessage = '';
    this.showInviteModal = true;
  }

  closeInviteModal() {
    this.showInviteModal = false;
  }

  async submitInvite() {
    const normalizedEmail = this.inviteForm.email.trim().toLowerCase();
    const fullName = this.inviteForm.fullName.trim();

    if (!normalizedEmail || !fullName) {
      this.error = 'L\'email et le nom complet sont obligatoires.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      this.error = 'Veuillez saisir une adresse email valide.';
      return;
    }

    if (!this.inviteForm.roleId) {
      this.error = 'Veuillez selectionner un role.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const existingUser = await this.supabase.findExistingUserByEmail(normalizedEmail);
    if (existingUser) {
      this.error = existingUser.account_status === 'active'
        ? 'Un compte existe deja avec cette adresse email.'
        : 'Cette adresse email a deja ete invitee. Utilisez le renvoi de l email d activation depuis la liste.';
      this.isSaving = false;
      return;
    }

    const redirectTo = this.supabase.getInviteRedirectUrl();
    const { userId, error: inviteErr } = await this.supabase.inviteUser(
      normalizedEmail,
      fullName,
      redirectTo
    );

    if (inviteErr || !userId) {
      this.error = inviteErr ?? 'Erreur lors de l invitation.';
      this.isSaving = false;
      return;
    }

    const profileErr = await this.supabase.upsertProfile({
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      phone: this.inviteForm.phone || null,
    });

    if (profileErr) {
      this.error = profileErr;
      this.isSaving = false;
      return;
    }

    const roleErr = await this.supabase.assignRole(userId, this.inviteForm.roleId, this.currentUserId);
    if (roleErr) {
      this.error = roleErr;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Invitation envoyee a ${normalizedEmail} avec succes !`;
    this.showInviteModal = false;
    this.isSaving = false;

    await this.loadData();
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  openEditModal(user: TjsUserWithRoles) {
    this.selectedUser = user;
    this.editForm = {
      full_name: user.full_name,
      phone: user.phone,
      bio: user.bio,
      is_member: user.is_member,
      is_pag_artist: user.is_pag_artist,
      member_since: user.member_since,
      member_until: user.member_until,
    };
    this.error = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  async submitEdit() {
    if (!this.selectedUser) return;
    this.isSaving = true;
    this.error = '';

    const err = await this.supabase.updateProfile(this.selectedUser.id, {
      full_name: this.editForm.full_name ?? null,
      phone: this.editForm.phone ?? null,
      bio: this.editForm.bio ?? null,
      is_member: this.editForm.is_member ?? false,
      is_pag_artist: this.editForm.is_pag_artist ?? false,
      member_since: this.editForm.member_since ?? null,
      member_until: this.editForm.member_until ?? null,
    });

    if (err) {
      this.error = err;
    } else {
      this.successMessage = 'Profil mis a jour avec succes.';
      this.showEditModal = false;
      await this.loadData();
      setTimeout(() => (this.successMessage = ''), 4000);
    }
    this.isSaving = false;
  }

  openRoleModal(user: TjsUserWithRoles) {
    this.selectedUser = user;
    this.roleModalRoles = this.allRoles.map((role) => ({
      role,
      assigned: user.roles.some((r) => r.id === role.id),
    }));
    this.error = '';
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
    this.selectedUser = null;
  }

  async toggleRole(entry: { role: TjsRole; assigned: boolean }) {
    if (!this.selectedUser) return;
    this.isSaving = true;
    this.error = '';

    let err: string | null;
    if (entry.assigned) {
      err = await this.supabase.removeRole(this.selectedUser.id, entry.role.id);
      if (!err) entry.assigned = false;
    } else {
      err = await this.supabase.assignRole(this.selectedUser.id, entry.role.id, this.currentUserId);
      if (!err) entry.assigned = true;
    }

    if (err) this.error = err;
    this.isSaving = false;
    await this.loadData();
    this.selectedUser = this.users.find((u) => u.id === this.selectedUser!.id) ?? null;
  }

  async resendActivationEmail(user: TjsUserWithRoles) {
    if (user.account_status === 'active') return;

    this.isSaving = true;
    this.error = '';

    const redirectTo = this.supabase.getInviteRedirectUrl();
    const err = await this.supabase.resendInvite(
      user.email,
      user.full_name || user.email,
      redirectTo
    );

    if (err) {
      this.error = err;
    } else {
      this.successMessage = `Email d activation renvoye a ${user.email}.`;
      await this.loadData();
      setTimeout(() => (this.successMessage = ''), 5000);
    }

    this.isSaving = false;
  }

  async sendResetPasswordEmail(user: TjsUserWithRoles) {
    this.isSaving = true;
    this.error = '';

    const redirectTo = this.supabase.getInviteRedirectUrl();
    const err = await this.supabase.sendPasswordResetEmail(user.email, redirectTo);

    if (err) {
      this.error = err;
    } else {
      this.successMessage = `Email de reinitialisation envoye a ${user.email}.`;
      setTimeout(() => (this.successMessage = ''), 5000);
    }

    this.isSaving = false;
  }

  accountStatusLabel(user: TjsUserWithRoles): string {
    return user.account_status === 'active' ? 'Actif' : 'Inactif';
  }

  accountStatusClass(user: TjsUserWithRoles): string {
    return user.account_status === 'active'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-amber-50 text-amber-700';
  }

  roleBadgeClass(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'committee member':
        return 'bg-blue-100 text-blue-700';
      case 'member':
        return 'bg-green-100 text-green-700';
      case 'host':
        return 'bg-orange-100 text-orange-700';
      case 'host manager':
        return 'bg-cyan-100 text-cyan-700';
      case 'host+':
        return 'bg-amber-100 text-amber-700';
      case 'artist':
        return 'bg-purple-100 text-purple-700';
      case 'artist invited':
        return 'bg-violet-100 text-violet-700';
      default:
        return 'bg-zinc-100 text-zinc-600';
    }
  }

  roleLabelFr(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'committee member':
        return 'Comite';
      case 'member':
        return 'Membre';
      case 'host':
        return 'Hote';
      case 'host manager':
        return 'Host Manager';
      case 'host+':
        return 'Hote+';
      case 'artist':
        return 'Artiste';
      case 'artist invited':
        return 'Artiste invite';
      default:
        return roleName;
    }
  }

  avatarLetter(user: TjsUserWithRoles): string {
    if (user.full_name) return user.full_name.charAt(0).toUpperCase();
    return user.email.charAt(0).toUpperCase();
  }

  private blankInvite(): InviteForm {
    return { email: '', fullName: '', phone: '', roleId: '' };
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }
}
