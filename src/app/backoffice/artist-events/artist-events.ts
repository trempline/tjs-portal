import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HostWorkspaceEventItem, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-artist-events',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './artist-events.html',
})
export class ArtistEvents implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  searchQuery = '';

  items: HostWorkspaceEventItem[] = [];

  async ngOnInit() {
    this.isLoading = true;
    this.error = '';

    try {
      await this.authService.waitForAuthReady();
      const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
      if (!profileId) {
        this.error = 'Artist events could not be loaded.';
        return;
      }

      this.items = await this.supabase.getArtistWorkspaceEvents(profileId);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist events could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  get filteredEvents() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.items
      .filter((item) => {
        if (!query) {
          return true;
        }

        const haystacks = [
          item.title,
          item.description ?? '',
          item.event_domain_name ?? '',
          item.edition ?? '',
          item.event_type_name ?? '',
          item.artist_names.join(' '),
          item.instruments.join(' '),
          this.statusLabel(item.status),
        ];

        return haystacks.some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const aDate = a.primary_upcoming_date ?? '9999-12-31';
        const bDate = b.primary_upcoming_date ?? '9999-12-31';
        if (aDate !== bDate) {
          return aDate.localeCompare(bDate);
        }

        return a.title.localeCompare(b.title);
      });
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'SELECTED':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Active';
      case 'SELECTED':
        return 'Inactive';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  primaryArtist(item: HostWorkspaceEventItem): string {
    return item.artist_names[0] ?? 'Unassigned';
  }

  instrumentsLabel(item: HostWorkspaceEventItem): string {
    if (item.instruments.length === 0) {
      return 'No instruments';
    }

    if (item.instruments.length === 1) {
      return item.instruments[0];
    }

    return `${item.instruments[0]} +${item.instruments.length - 1}`;
  }

  async openEvent(item: HostWorkspaceEventItem) {
    await this.router.navigate(['/backoffice/artist-events', item.id]);
  }
}
