import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  SupabaseService,
  TjsArtist,
  TjsArtistAuditLog,
  TjsArtistUserSummary,
} from '../../services/supabase.service';

type ArtistTab = 'tjs' | 'invited';

@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './artists.html',
})
export class Artists implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  allArtists: TjsArtist[] = [];
  committeeMembers: TjsArtistUserSummary[] = [];
  activeTab: ArtistTab = 'tjs';

  showAuditModal = false;
  selectedArtist: TjsArtist | null = null;
  auditLogs: TjsArtistAuditLog[] = [];
  auditLoading = false;

  showAssignmentModal = false;
  selectedArtistForAssignment: TjsArtist | null = null;
  selectedCommitteeMemberId = '';

  setTab(tab: ArtistTab) {
    this.activeTab = tab;
  }

  get currentArtists(): TjsArtist[] {
    if (this.isCommittee) {
      return [...this.allArtists].sort((a, b) => {
        const priority = { active: 0, pending: 1, inactive: 2 } as const;
        return priority[a.activation_status] - priority[b.activation_status] || a.artist_name.localeCompare(b.artist_name);
      });
    }

    if (this.activeTab === 'tjs') {
      return this.allArtists.filter((artist) => artist.is_tjs_artist);
    }
    return this.allArtists.filter((artist) => artist.is_invited_artist);
  }

  get tjsCount() {
    return this.allArtists.filter((artist) => artist.is_tjs_artist).length;
  }

  get invitedCount() {
    return this.allArtists.filter((artist) => artist.is_invited_artist).length;
  }

  get featuredCount() {
    return this.allArtists.filter((artist) => artist.is_featured).length;
  }

  get activeCount() {
    return this.allArtists.filter((artist) => artist.activation_status === 'active').length;
  }

  get pendingActivationCount() {
    return this.allArtists.filter((artist) => artist.activation_status === 'pending').length;
  }

  get assignedCount() {
    return this.allArtists.filter((artist) => !!artist.committee_member_id).length;
  }

  get unassignedCount() {
    return this.allArtists.filter((artist) => !artist.committee_member_id).length;
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isCommittee(): boolean {
    return this.authService.hasRole('Committee Member');
  }

  get canManageArtists(): boolean {
    return this.isAdmin || this.isCommittee;
  }

  async ngOnInit() {
    // Set activeTab based on route
    const url = this.router.url;
    if (url.includes('/artists/invited')) {
      this.activeTab = 'invited';
    } else {
      this.activeTab = 'tjs';
    }

    await this.loadData();
  }

  private async loadData() {
    this.isLoading = true;
    this.error = '';

    const artistScope = this.isAdmin || !this.currentUserId
      ? undefined
      : { committeeMemberId: this.currentUserId, createdById: this.currentUserId };

    const [artists, committeeMembers] = await Promise.all([
      this.supabase.getArtists(artistScope),
      this.supabase.getCommitteeMembersForAssignment(),
    ]);

    this.allArtists = artists;
    this.committeeMembers = committeeMembers;
    this.isLoading = false;
  }

  async toggleFeatured(artist: TjsArtist) {
    if (!this.canManageArtists) return;

    this.isSaving = true;
    this.error = '';

    const newFeatured = !artist.is_featured;
    const reason = newFeatured
      ? `Masque du site public par ${this.authService.displayName}`
      : `Retabli sur le site public par ${this.authService.displayName}`;

    const { error } = await this.supabase.toggleArtistFeatured(
      artist.id,
      newFeatured,
      this.currentUserId,
      reason
    );

    if (error) {
      this.error = error;
    } else {
      artist.is_featured = newFeatured;
      this.successMessage = newFeatured
        ? `${artist.artist_name} est maintenant masque du site public.`
        : `${artist.artist_name} est maintenant visible sur le site public.`;
      setTimeout(() => (this.successMessage = ''), 4000);
    }

    this.isSaving = false;
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

  openAssignmentModal(artist: TjsArtist) {
    if (!this.isAdmin) return;

    this.selectedArtistForAssignment = artist;
    this.selectedCommitteeMemberId = artist.committee_member_id ?? '';
    this.error = '';
    this.showAssignmentModal = true;
  }

  closeAssignmentModal() {
    this.showAssignmentModal = false;
    this.selectedArtistForAssignment = null;
    this.selectedCommitteeMemberId = '';
  }

  async submitAssignment() {
    if (!this.isAdmin || !this.selectedArtistForAssignment) return;

    if (!this.selectedCommitteeMemberId) {
      this.error = 'Veuillez selectionner un membre du comite.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const error = await this.supabase.assignCommitteeMemberToArtist(
      this.selectedArtistForAssignment.id,
      this.selectedCommitteeMemberId
    );

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    const assignedCommitteeMember =
      this.committeeMembers.find((member) => member.id === this.selectedCommitteeMemberId) ?? null;
    const assignedArtistName = this.displayName(this.selectedArtistForAssignment);

    this.allArtists = this.allArtists.map((artist) =>
      artist.id === this.selectedArtistForAssignment?.id
        ? {
            ...artist,
            committee_member_id: this.selectedCommitteeMemberId,
            committee_member: assignedCommitteeMember,
          }
        : artist
    );

    this.successMessage = assignedCommitteeMember
      ? `${assignedArtistName} est maintenant suivi par ${this.userSummaryName(assignedCommitteeMember)}.`
      : 'Le membre du comite a ete assigne avec succes.';
    this.closeAssignmentModal();
    this.isSaving = false;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  displayName(artist: TjsArtist): string {
    return artist.profile?.full_name || artist.artist_name || '-';
  }

  avatarLetter(artist: TjsArtist): string {
    const name = this.displayName(artist);
    return name.charAt(0).toUpperCase();
  }

  featuredLabel(artist: TjsArtist): string {
    return artist.is_featured ? 'Masque' : 'Visible';
  }

  featuredClass(artist: TjsArtist): string {
    return artist.is_featured
      ? 'bg-amber-50 text-amber-700'
      : 'bg-emerald-50 text-emerald-700';
  }

  activationStatusLabel(artist: TjsArtist): string {
    switch (artist.activation_status) {
      case 'active':
        return 'Activated';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Pending';
    }
  }

  activationStatusClass(artist: TjsArtist): string {
    switch (artist.activation_status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700';
      case 'inactive':
        return 'bg-zinc-100 text-zinc-600';
      default:
        return 'bg-amber-50 text-amber-700';
    }
  }

  typeBadges(artist: TjsArtist): string[] {
    const badges: string[] = [];
    if (artist.is_tjs_artist) badges.push('TJS');
    if (artist.is_invited_artist) badges.push('Invite');
    return badges;
  }

  committeeManagerName(artist: TjsArtist): string {
    return this.userSummaryName(artist.committee_member);
  }

  committeeManagerEmail(artist: TjsArtist): string {
    return artist.committee_member?.email || '';
  }

  creatorName(artist: TjsArtist): string {
    return this.userSummaryName(artist.created_by_profile);
  }

  creatorEmail(artist: TjsArtist): string {
    return artist.created_by_profile?.email || '';
  }

  needsAssignment(artist: TjsArtist): boolean {
    return !artist.committee_member_id;
  }

  assignmentButtonLabel(artist: TjsArtist): string {
    return artist.committee_member_id ? 'Reassigner' : 'Assigner';
  }

  committeeMemberOptionLabel(member: TjsArtistUserSummary): string {
    const name = this.userSummaryName(member);
    return member.email && member.email !== name ? `${name} - ${member.email}` : name;
  }

  private userSummaryName(user: TjsArtistUserSummary | null | undefined): string {
    return user?.full_name || user?.email || 'Utilisateur inconnu';
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }
}
