import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistNotificationItem,
  SupabaseService,
  TjsRole,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-notifications',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule],
  templateUrl: './artist-notifications.html',
})
export class ArtistNotifications implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSending = false;
  isDeleting = false;
  error = '';
  successMessage = '';
  receivedNotifications: ArtistNotificationItem[] = [];
  sentNotifications: ArtistNotificationItem[] = [];
  selectedNotification: ArtistNotificationItem | null = null;
  roleOptions: TjsRole[] = [];
  isComposeOpen = false;
  activeTab: 'received' | 'sent' = 'received';
  compose = {
    recipientRoleId: '',
    subject: '',
    body: '',
    expiresAt: '',
  };

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    const roleIds = this.authService.currentRoles.map((role) => role.id);
    if (!profileId) {
      this.error = 'Notifications could not be loaded.';
      this.isLoading = false;
      return;
    }

    if (this.canComposeNotifications) {
      this.roleOptions = await this.supabase.getAllRoles();
    }

    await this.loadNotifications(profileId, roleIds);
  }

  get isCommittee(): boolean {
    return this.authService.hasRole('Committee Member');
  }

  get canComposeNotifications(): boolean {
    return this.isCommittee;
  }

  get notifications(): ArtistNotificationItem[] {
    if (this.isCommittee && this.activeTab === 'sent') {
      return this.sentNotifications;
    }

    return this.receivedNotifications;
  }

  get pageTitle(): string {
    return 'Notification';
  }

  get pageDescription(): string {
    return this.isCommittee
      ? 'Review incoming notifications, track everything you have sent, and remove sent notifications before they expire.'
      : 'Review notifications sent by Hosts, Host Managers, Host+, Committee Members, and Admins.';
  }

  get emptyStateMessage(): string {
    if (this.isCommittee && this.activeTab === 'sent') {
      return 'You have not sent any notifications yet.';
    }

    return "You'll see notifications here when they're sent to you";
  }

  openCompose() {
    this.error = '';
    this.successMessage = '';
    this.compose = {
      recipientRoleId: '',
      subject: '',
      body: '',
      expiresAt: '',
    };
    this.isComposeOpen = true;
  }

  closeCompose() {
    this.isComposeOpen = false;
  }

  async sendNotification() {
    const profileId = this.authService.currentUser?.id;
    const currentRoleName = this.authService.currentRoles[0]?.name ?? null;

    if (!profileId || !currentRoleName) {
      this.error = 'Notification could not be sent.';
      return;
    }

    if (!this.compose.recipientRoleId) {
      this.error = 'Recipient role is required.';
      return;
    }

    if (!this.compose.subject.trim()) {
      this.error = 'Subject is required.';
      return;
    }

    if (!this.compose.body.trim()) {
      this.error = 'Message is required.';
      return;
    }

    this.isSending = true;
    this.error = '';
    this.successMessage = '';

    const error = await this.supabase.createRoleNotification({
      recipient_role_id: this.compose.recipientRoleId,
      sender_profile_id: profileId,
      sender_role: currentRoleName,
      subject: this.compose.subject,
      body: this.compose.body,
      expires_at: this.compose.expiresAt || null,
    });

    if (error) {
      this.error = error;
      this.isSending = false;
      return;
    }

    this.successMessage = 'Notification sent successfully.';
    this.isComposeOpen = false;
    this.activeTab = 'sent';
    await this.loadNotifications(profileId, this.authService.currentRoles.map((role) => role.id));
    this.isSending = false;
  }

  async openNotification(notification: ArtistNotificationItem) {
    this.selectedNotification = notification;

    if (this.isCommittee && this.activeTab === 'sent') {
      return;
    }

    if (!notification.is_read) {
      const profileId = this.authService.currentUser?.id;
      if (!profileId) {
        return;
      }

      const error = await this.supabase.markArtistNotificationRead(notification.id, profileId);
      if (!error) {
        this.receivedNotifications = this.receivedNotifications.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        );
        this.selectedNotification = { ...notification, is_read: true };
      }
    }
  }

  closeNotification() {
    this.selectedNotification = null;
  }

  setActiveTab(tab: 'received' | 'sent') {
    this.activeTab = tab;
    this.selectedNotification = null;
    this.error = '';
    this.successMessage = '';
  }

  isExpired(notification: ArtistNotificationItem): boolean {
    if (!notification.expires_at) {
      return false;
    }

    const expiresAt = new Date(notification.expires_at).getTime();
    return !Number.isNaN(expiresAt) && expiresAt < Date.now();
  }

  canDelete(notification: ArtistNotificationItem): boolean {
    return this.isCommittee && this.activeTab === 'sent' && !this.isExpired(notification);
  }

  async deleteNotification(event: Event, notification: ArtistNotificationItem) {
    event.stopPropagation();

    if (!this.canDelete(notification) || this.isDeleting) {
      return;
    }

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Notification could not be deleted.';
      return;
    }

    this.isDeleting = true;
    this.error = '';
    this.successMessage = '';

    const error = await this.supabase.deleteSentArtistNotification(notification.id, profileId);

    if (error) {
      this.error = error;
      this.isDeleting = false;
      return;
    }

    this.sentNotifications = this.sentNotifications.filter((item) => item.id !== notification.id);
    if (this.selectedNotification?.id === notification.id) {
      this.selectedNotification = null;
    }
    this.successMessage = 'Notification deleted successfully.';
    this.isDeleting = false;
  }

  trimBody(body: string, maxLength = 140): string {
    const normalized = body.trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trimEnd()}...`;
  }

  trackByNotification(_: number, item: ArtistNotificationItem) {
    return item.id;
  }

  private async loadNotifications(profileId: string, roleIds: string[]) {
    const [receivedNotifications, sentNotifications] = await Promise.all([
      this.supabase.getArtistWorkspaceNotifications(profileId, roleIds),
      this.isCommittee ? this.supabase.getSentArtistWorkspaceNotifications(profileId) : Promise.resolve([]),
    ]);
    const now = Date.now();

    this.receivedNotifications = receivedNotifications.filter((item) => {
      if (!item.expires_at) {
        return true;
      }

      const expiresAt = new Date(item.expires_at).getTime();
      return Number.isNaN(expiresAt) || expiresAt >= now;
    });
    this.sentNotifications = sentNotifications;

    this.isLoading = false;
  }
}
