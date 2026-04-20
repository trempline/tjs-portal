import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HostManagerService, HostManagerDashboardStats } from '../../services/host-manager.service';
import { MessagingService, MessageConversation } from '../../services/messaging.service';
import { RequestSuggestionService, RequestSuggestion } from '../../services/request-suggestion.service';
import { TjsHost } from '../../services/supabase.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-host-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-manager-dashboard.html',
  styleUrl: './host-manager-dashboard.scss'
})
export class HostManagerDashboard implements OnInit {
  private authService = inject(AuthService);
  private hostManagerService = inject(HostManagerService);
  private messagingService = inject(MessagingService);
  private requestSuggestionService = inject(RequestSuggestionService);

  isLoading = true;
  error = '';
  stats: HostManagerDashboardStats | null = null;
  assignedHosts: TjsHost[] = [];
  recentMessages: MessageConversation[] = [];
  pendingSuggestions: RequestSuggestion[] = [];

  get currentUserId(): string {
    return this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
  }

  get displayName(): string {
    return this.authService.displayName;
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    await this.authService.waitForAuthReady();

    const userId = this.currentUserId;
    if (!userId) {
      this.isLoading = false;
      this.error = 'User not authenticated.';
      return;
    }

    try {
      const [stats, hosts] = await Promise.all([
        lastValueFrom(this.hostManagerService.getDashboardStats(userId)),
        lastValueFrom(this.hostManagerService.getAssignedHosts(userId)),
      ]);

      this.stats = stats;
      this.assignedHosts = hosts;

      const [messages, suggestions] = await Promise.all([
        lastValueFrom(this.messagingService.getConversations()).catch((error) => {
          console.error('Error loading host manager messages:', error);
          return [] as MessageConversation[];
        }),
        this.requestSuggestionService.getPendingSuggestionsForManagedHosts(userId).catch((error) => {
          console.error('Error loading host manager suggestions:', error);
          return [] as RequestSuggestion[];
        })
      ]);

      this.recentMessages = messages;
      this.pendingSuggestions = suggestions;
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      this.error = 'Failed to load dashboard data';
    }

    this.isLoading = false;
  }

  get unreadMessagesCount(): number {
    return this.recentMessages.reduce((sum, conv) => sum + conv.unread_count, 0);
  }

  get pendingSuggestionsCount(): number {
    return this.pendingSuggestions.length;
  }
}
