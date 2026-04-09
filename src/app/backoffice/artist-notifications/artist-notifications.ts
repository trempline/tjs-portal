import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  ArtistNotificationItem,
  SupabaseService,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-notifications',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe],
  templateUrl: './artist-notifications.html',
})
export class ArtistNotifications implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  notifications: ArtistNotificationItem[] = [];
  selectedNotification: ArtistNotificationItem | null = null;

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    const roleIds = this.authService.currentRoles.map((role) => role.id);
    if (!profileId) {
      this.error = 'Artist notifications could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadNotifications(profileId, roleIds);
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
