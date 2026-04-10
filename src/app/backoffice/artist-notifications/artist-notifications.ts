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
  error = '';
  successMessage = '';
  notifications: ArtistNotificationItem[] = [];
  selectedNotification: ArtistNotificationItem | null = null;
  roleOptions: TjsRole[] = [];
  isComposeOpen = false;
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

  get pageTitle(): string {
    return 'Notification';
  }

  get pageDescription(): string {
    return this.isCommittee
      ? 'Review incoming notifications and send role-based notifications across the workspace.'
      : 'Review notifications sent by Hosts, Host Managers, Host+, Committee Members, and Admins.';
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
    await this.loadNotifications(profileId, this.authService.currentRoles.map((role) => role.id));
    this.isSending = false;
  }

  async openNotification(notification: ArtistNotificationItem) {
    this.selectedNotification = notification;

    if (!notification.is_read) {
      const profileId = this.authService.currentUser?.id;
      if (!profileId) {
        return;
      }

      const error = await this.supabase.markArtistNotificationRead(notification.id, profileId);
      if (!error) {
        this.notifications = this.notifications.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        );
        this.selectedNotification = { ...notification, is_read: true };
      }
    }
  }

  closeNotification() {
    this.selectedNotification = null;
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
    const notifications = await this.supabase.getArtistWorkspaceNotifications(profileId, roleIds);
    const now = Date.now();

    this.notifications = notifications.filter((item) => {
      if (!item.expires_at) {
        return true;
      }

      const expiresAt = new Date(item.expires_at).getTime();
      return Number.isNaN(expiresAt) || expiresAt >= now;
    });

    this.isLoading = false;
  }
}
