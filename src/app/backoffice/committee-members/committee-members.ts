import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService, TjsUserWithRoles, TjsRole, TjsArtist, TjsArtistAuditLog } from '../../services/supabase.service';

interface CommitteeMemberForm {
  email: string;
  fullName: string;
  phone: string;
  roleId: string;
}

@Component({
  selector: 'app-committee-members',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, DatePipe, NgClass, FormsModule],
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

  // ── Artist management ────────────────────────────────────────────────────
  artists: TjsArtist[] = [];
  artistSearchQuery = '';
  showAuditModal = false;
  selectedArtist: TjsArtist | null = null;
  auditLogs: TjsArtistAuditLog[] = [];
  auditLoading = false;

  get filteredArtists(): TjsArtist[] {
    const q = this.artistSearchQuery.toLowerCase().trim();
    if (!q) return this.artists;
    return this.artists.filter((a) => {
      const name = (a.profile?.full_name || a.artist_name || '').toLowerCase();
      const email = (a.profile?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  get tjsArtistCount() { return this.artists.filter((a) => a.is_tjs_artist).length; }
  get invitedArtistCount() { return this.artists.filter((a) => a.is_invited_artist).length; }
  get featuredArtistCount() { return this.artists.filter((a) => a.is_featured).length; }

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
    const [users, roles, artists] = await Promise.all([
      this.supabase.listAllUsersWithRoles(),
      this.supabase.getAllRoles(),
      this.supabase.getArtists(),
    ]);
    this.committeeMembers = users;
    this.allRoles = roles;
    this.artists = artists;
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
      case 'host manager':     return 'bg-cyan-100 text-cyan-700';
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

  async toggleArtistFeatured(artist: TjsArtist) {
    this.isSaving = true;
    this.error = '';

    const newFeatured = !artist.is_featured;
    const reason = newFeatured
      ? `Masqu\u00e9 du site public par ${this.authService.displayName}`
      : `R\u00e9tabli sur le site public par ${this.authService.displayName}`;

    const { success, error: err } = await this.supabase.toggleArtistFeatured(
      artist.id,
      newFeatured,
      this.currentUserId,
      reason
    );

    if (err) {
      this.error = err;
    } else {
      artist.is_featured = newFeatured;
      this.successMessage = newFeatured
        ? `${artist.artist_name} est maintenant masqu\u00e9 du site public.`
        : `${artist.artist_name} est maintenant visible sur le site public.`;
      setTimeout(() => (this.successMessage = ''), 4000);
    }

    this.isSaving = false;
  }

  toggleFeatured(artist: TjsArtist) {
    void this.toggleArtistFeatured(artist);
  }

  async openAuditModal(artist: TjsArtist) {
    this.selectedArtist = artist;
    this.auditLogs = [];
    this.auditLoading = true;
    this.showAuditModal = true;

    const logs = await this.supabase.getArtistAuditLog(artist.id);
    this.auditLogs = logs;
    this.auditLoading = false;
  }

  closeAuditModal() {
    this.showAuditModal = false;
    this.selectedArtist = null;
  }

  artistDisplayName(artist: TjsArtist): string {
    return artist.profile?.full_name || artist.artist_name || '—';
  }

  artistAvatarLetter(artist: TjsArtist): string {
    const name = this.artistDisplayName(artist);
    return name.charAt(0).toUpperCase();
  }

  featuredLabel(artist: TjsArtist): string {
    return artist.is_featured ? 'Masqu\u00e9' : 'Visible';
  }

  featuredClass(artist: TjsArtist): string {
    return artist.is_featured
      ? 'bg-amber-50 text-amber-700'
      : 'bg-emerald-50 text-emerald-700';
  }

  artistTypeBadges(artist: TjsArtist): string[] {
    const badges: string[] = [];
    if (artist.is_tjs_artist) badges.push('TJS');
    if (artist.is_invited_artist) badges.push('Invit\u00e9');
    return badges;
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }
}
