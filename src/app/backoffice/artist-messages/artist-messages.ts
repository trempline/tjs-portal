import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistConversationMessage,
  ArtistConversationSummary,
  ArtistMessageDirectoryUser,
  SupabaseService,
  TjsRole,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-messages',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './artist-messages.html',
})
export class ArtistMessages implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSending = false;
  isReplySending = false;
  isComposeOpen = false;
  activeTab: 'inbox' | 'archived' = 'inbox';
  error = '';
  successMessage = '';

  allConversations: ArtistConversationSummary[] = [];
  selectedConversation: ArtistConversationSummary | null = null;
  selectedMessages: ArtistConversationMessage[] = [];
  roleOptions: TjsRole[] = [];
  directoryUsers: ArtistMessageDirectoryUser[] = [];

  compose = {
    roleId: '',
    recipientId: '',
    subject: '',
    body: '',
  };

  replyBody = '';

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) {
      this.error = 'Artist messages could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadInitialData(currentUserId);
  }

  get conversations(): ArtistConversationSummary[] {
    return this.allConversations.filter((conversation) =>
      this.activeTab === 'archived' ? conversation.is_archived : !conversation.is_archived
    );
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get recipientOptions(): ArtistMessageDirectoryUser[] {
    const selectedRoleId = this.compose.roleId;
    const currentUserId = this.authService.currentUser?.id;

    return this.directoryUsers.filter((user) =>
      user.id !== currentUserId && user.roles.some((role) => role.id === selectedRoleId)
    );
  }

  openCompose() {
    this.error = '';
    this.successMessage = '';
    this.isComposeOpen = true;
    this.compose = {
      roleId: '',
      recipientId: '',
      subject: '',
      body: '',
    };
  }

  closeCompose() {
    this.isComposeOpen = false;
  }

  onRoleChange() {
    this.compose.recipientId = '';
  }

  async selectConversation(conversation: ArtistConversationSummary) {
    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) {
      return;
    }

    this.selectedConversation = conversation;
    this.error = '';
    this.successMessage = '';
    this.replyBody = '';

    try {
      this.selectedMessages = await this.supabase.getArtistConversationMessages(
        currentUserId,
        conversation.other_user_id,
        conversation.subject
      );
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load conversation.';
      this.selectedMessages = [];
      return;
    }

    if (conversation.unread_count > 0) {
      await this.supabase.markArtistConversationRead(
        currentUserId,
        conversation.other_user_id,
        conversation.subject
      );

      this.allConversations = this.allConversations.map((item) =>
        item.other_user_id === conversation.other_user_id && item.subject === conversation.subject
          ? { ...item, unread_count: 0 }
          : item
      );
    }
  }

  async sendMessage() {
    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) {
      this.error = 'Artist messages could not be sent.';
      return;
    }

    this.error = '';
    this.successMessage = '';

    if (!this.compose.subject.trim()) {
      this.error = 'Topic is required.';
      return;
    }

    if (!this.compose.recipientId) {
      this.error = 'Recipient is required.';
      return;
    }

    if (!this.compose.body.trim()) {
      this.error = 'Message is required.';
      return;
    }

    this.isSending = true;
    const error = await this.supabase.sendArtistMessage(
      currentUserId,
      this.compose.recipientId,
      this.compose.subject,
      this.compose.body
    );

    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Message sent successfully.';
      this.isComposeOpen = false;
      await this.reloadConversations(currentUserId);

      const createdConversation = this.allConversations.find((item) =>
        item.other_user_id === this.compose.recipientId && item.subject === this.compose.subject.trim()
      );

      if (createdConversation) {
        await this.selectConversation(createdConversation);
      }
    }

    this.isSending = false;
  }

  async sendReply() {
    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId || !this.selectedConversation) {
      this.error = 'Reply could not be sent.';
      return;
    }

    this.error = '';
    this.successMessage = '';

    if (!this.replyBody.trim()) {
      this.error = 'Reply message is required.';
      return;
    }

    this.isReplySending = true;
    const error = await this.supabase.sendArtistMessage(
      currentUserId,
      this.selectedConversation.other_user_id,
      this.selectedConversation.subject,
      this.replyBody
    );

    if (error) {
      this.error = error;
      this.isReplySending = false;
      return;
    }

    this.replyBody = '';
    this.successMessage = 'Reply sent successfully.';
    await this.reloadConversations(currentUserId);

    const updatedConversation = this.allConversations.find((item) =>
      item.other_user_id === this.selectedConversation?.other_user_id
      && item.subject === this.selectedConversation?.subject
    );

    if (updatedConversation) {
      await this.selectConversation(updatedConversation);
    }

    this.isReplySending = false;
  }

  async archiveSelectedConversation() {
    if (!this.selectedConversation) {
      return;
    }

    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) {
      return;
    }

    const error = await this.supabase.setArtistConversationState(
      currentUserId,
      this.selectedConversation.other_user_id,
      this.selectedConversation.subject,
      { is_archived: true, is_deleted: false }
    );

    if (error) {
      this.error = error;
      return;
    }

    this.selectedConversation = null;
    this.selectedMessages = [];
    await this.reloadConversations(currentUserId);
  }

  async deleteSelectedConversation() {
    if (!this.selectedConversation) {
      return;
    }

    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) {
      return;
    }

    const error = await this.supabase.setArtistConversationState(
      currentUserId,
      this.selectedConversation.other_user_id,
      this.selectedConversation.subject,
      { is_archived: false, is_deleted: true }
    );

    if (error) {
      this.error = error;
      return;
    }

    this.selectedConversation = null;
    this.selectedMessages = [];
    await this.reloadConversations(currentUserId);
  }

  async unarchiveConversation(conversation: ArtistConversationSummary) {
    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) {
      return;
    }

    const error = await this.supabase.setArtistConversationState(
      currentUserId,
      conversation.other_user_id,
      conversation.subject,
      { is_archived: false, is_deleted: false }
    );

    if (error) {
      this.error = error;
      return;
    }

    await this.reloadConversations(currentUserId);
  }

  trackByConversation(_: number, item: ArtistConversationSummary) {
    return `${item.other_user_id}::${item.subject}`;
  }

  trackByMessage(_: number, item: ArtistConversationMessage) {
    return item.id;
  }

  private async loadInitialData(currentUserId: string) {
    try {
      const [roles, users] = await Promise.all([
        this.supabase.getAllRoles(),
        this.supabase.getArtistMessageDirectory(),
      ]);

      this.roleOptions = roles;
      this.directoryUsers = users;
      await this.reloadConversations(currentUserId);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist messages could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  private async reloadConversations(currentUserId: string) {
    this.allConversations = await this.supabase.getArtistConversations(currentUserId);

    if (this.selectedConversation) {
      const updatedSelected = this.allConversations.find((item) =>
        item.other_user_id === this.selectedConversation?.other_user_id
        && item.subject === this.selectedConversation?.subject
      );

      if (updatedSelected) {
        this.selectedConversation = updatedSelected;
      }
    }
  }
}
