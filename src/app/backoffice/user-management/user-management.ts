import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService, TjsUserWithRoles, TjsRole } from '../../services/supabase.service';

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

  // ── State ────────────────────────────────────────────────────────────────
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

  // Role modal state
  roleModalRoles: { role: TjsRole; assigned: boolean }[] = [];

  // ── Computed / filtered ──────────────────────────────────────────────────
  setTab(key: string) {
    this.activeTab = key as UserTab;
  }

  private hasRole(user: TjsUserWithRoles, roleName: string): boolean {
    return user.roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
  }

  get filteredUsers(): TjsUserWithRoles[] {
    switch (this.activeTab) {
      case 'admins':
        return this.users.filter(u => this.hasRole(u, 'admin'));
      case 'committee':
        return this.users.filter(u => this.hasRole(u, 'committee member'));
      case 'members':
        return this.users.filter(u => this.hasRole(u, 'member'));
      default:
        return this.users;
    }
  }

  get adminCount() { return this.users.filter(u => this.hasRole(u, 'admin')).length; }
  get committeeCount() { return this.users.filter(u => this.hasRole(u, 'committee member')).length; }
  get memberCount() { return this.users.filter(u => this.hasRole(u, 'member')).length; }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
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

  // ── Invite ───────────────────────────────────────────────────────────────
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
    if (!this.inviteForm.email || !this.inviteForm.fullName) {
      this.error = 'L\'email et le nom complet sont obligatoires.';
      return;
    }
    if (!this.inviteForm.roleId) {
      this.error = 'Veuillez sélectionner un rôle.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    // Build the redirect URL: app origin + /auth/callback
    const redirectTo = `${window.location.origin}/auth/callback`;

    // 1. Invite user (Supabase sends the email)
    const { userId, error: inviteErr } = await this.supabase.inviteUser(
      this.inviteForm.email,
      this.inviteForm.fullName,
      redirectTo
    );

    if (inviteErr || !userId) {
      this.error = inviteErr ?? 'Erreur lors de l\'invitation.';
      this.isSaving = false;
      return;
    }

    // 2. Pre-fill profile
    const profileErr = await this.supabase.upsertProfile({
      id: userId,
      email: this.inviteForm.email,
      full_name: this.inviteForm.fullName,
      phone: this.inviteForm.phone || null
      
    });

    if (profileErr) {
      this.error = profileErr;
      this.isSaving = false;
      return;
    }

    // 3. Assign role
    const roleErr = await this.supabase.assignRole(userId, this.inviteForm.roleId, this.currentUserId);
    if (roleErr) {
      this.error = roleErr;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Invitation envoyée à ${this.inviteForm.email} avec succès !`;
    this.showInviteModal = false;
    this.isSaving = false;

    // Reload list
    await this.loadData();
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  // ── Edit profile ─────────────────────────────────────────────────────────
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
      this.successMessage = 'Profil mis à jour avec succès.';
      this.showEditModal = false;
      await this.loadData();
      setTimeout(() => (this.successMessage = ''), 4000);
    }
    this.isSaving = false;
  }

  // ── Role management ──────────────────────────────────────────────────────
  openRoleModal(user: TjsUserWithRoles) {
    this.selectedUser = user;
    this.roleModalRoles = this.allRoles.map(role => ({
      role,
      assigned: user.roles.some(r => r.id === role.id),
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
      // Remove role
      err = await this.supabase.removeRole(this.selectedUser.id, entry.role.id);
      if (!err) entry.assigned = false;
    } else {
      // Assign role
      err = await this.supabase.assignRole(this.selectedUser.id, entry.role.id, this.currentUserId);
      if (!err) entry.assigned = true;
    }

    if (err) this.error = err;
    this.isSaving = false;
    await this.loadData();
    // Refresh selectedUser reference
    this.selectedUser = this.users.find(u => u.id === this.selectedUser!.id) ?? null;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  roleBadgeClass(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'admin':            return 'bg-red-100 text-red-700';
      case 'committee member': return 'bg-blue-100 text-blue-700';
      case 'member':           return 'bg-green-100 text-green-700';
      case 'host':             return 'bg-orange-100 text-orange-700';
      case 'host+':            return 'bg-amber-100 text-amber-700';
      case 'artist':           return 'bg-purple-100 text-purple-700';
      case 'artist invited':   return 'bg-violet-100 text-violet-700';
      default:                 return 'bg-zinc-100 text-zinc-600';
    }
  }

  roleLabelFr(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'admin':            return 'Admin';
      case 'committee member': return 'Comité';
      case 'member':           return 'Membre';
      case 'host':             return 'Hôte';
      case 'host+':            return 'Hôte+';
      case 'artist':           return 'Artiste';
      case 'artist invited':   return 'Artiste invité';
      default:                 return roleName;
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
