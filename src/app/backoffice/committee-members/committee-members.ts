import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService, TjsUserWithRoles, TjsRole } from '../../services/supabase.service';

interface CommitteeMemberForm {
  email: string;
  fullName: string;
  phone: string;
  roleId: string;
}

@Component({
  selector: 'app-committee-members',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './committee-members.html',
})
export class CommitteeMembers implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  // ── State ────────────────────────────────────────────────────────────────
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  committeeMembers: TjsUserWithRoles[] = [];
  allRoles: TjsRole[] = [];

  // Modals
  showInviteModal = false;
  showEditModal = false;
  showRoleModal = false;

  selectedUser: TjsUserWithRoles | null = null;

  committeeMemberForm: CommitteeMemberForm = this.blankForm();
  editForm: Partial<TjsUserWithRoles> = {};

  // Role modal state
  roleModalRoles: { role: TjsRole; assigned: boolean }[] = [];

  // ── Computed / filtered ──────────────────────────────────────────────────
  get filteredCommitteeMembers(): TjsUserWithRoles[] {
    return this.committeeMembers.filter(u => 
      this.hasRole(u, 'Committee Member') || 
      this.hasRole(u, 'Admin')
    );
  }

  private hasRole(user: TjsUserWithRoles, roleName: string): boolean {
    return user.roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
  }

  get adminCount() { return this.committeeMembers.filter(u => this.hasRole(u, 'Admin')).length; }
  get committeeCount() { return this.committeeMembers.filter(u => this.hasRole(u, 'Committee Member')).length; }

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
    this.committeeMembers = users;
    this.allRoles = roles;
    this.isLoading = false;
  }

  // ── Invite Committee Member ──────────────────────────────────────────────
  openInviteModal() {
    this.committeeMemberForm = this.blankForm();
    this.error = '';
    this.successMessage = '';
    this.showInviteModal = true;
  }

  closeInviteModal() {
    this.showInviteModal = false;
  }

  async submitInvite() {
    if (!this.committeeMemberForm.email || !this.committeeMemberForm.fullName) {
      this.error = 'L\'email et le nom complet sont obligatoires.';
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.committeeMemberForm.email)) {
      this.error = 'Veuillez saisir une adresse email valide.';
      return;
    }
    
    if (!this.committeeMemberForm.roleId) {
      this.error = 'Veuillez sélectionner un rôle.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    // Build the redirect URL: app origin + /auth/callback
    const redirectTo = `${window.location.origin}/auth/callback`;

    try {
      // 1. Invite user (Supabase sends the email)
      const { userId, error: inviteErr } = await this.supabase.inviteUser(
        this.committeeMemberForm.email,
        this.committeeMemberForm.fullName,
        redirectTo
      );

      if (inviteErr || !userId) {
        this.error = inviteErr || 'Erreur lors de l\'invitation. Vérifiez que l\'adresse email n\'existe pas déjà.';
        this.isSaving = false;
        return;
      }

      // 2. Pre-fill profile
      const profileErr = await this.supabase.upsertProfile({
        id: userId,
        email: this.committeeMemberForm.email,
        full_name: this.committeeMemberForm.fullName,
        phone: this.committeeMemberForm.phone || null,
      });

      if (profileErr) {
        this.error = profileErr;
        this.isSaving = false;
        return;
      }

      // 3. Assign role
      const roleErr = await this.supabase.assignRole(userId, this.committeeMemberForm.roleId, this.currentUserId);
      if (roleErr) {
        this.error = roleErr;
        this.isSaving = false;
        return;
      }

      this.successMessage = `Invitation envoyée à ${this.committeeMemberForm.email} avec succès !`;
      this.showInviteModal = false;
      this.isSaving = false;

      // Reload list
      await this.loadData();
      setTimeout(() => (this.successMessage = ''), 5000);
    } catch (error) {
      console.error('submitInvite exception:', error);
      this.error = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      this.isSaving = false;
    }
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
    this.selectedUser = this.committeeMembers.find(u => u.id === this.selectedUser!.id) ?? null;
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

  private blankForm(): CommitteeMemberForm {
    return { email: '', fullName: '', phone: '', roleId: '' };
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }
}