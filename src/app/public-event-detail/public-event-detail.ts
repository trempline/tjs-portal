import { NgFor, NgIf, NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { SupabaseService, PublicEventDetail } from '../services/supabase.service';

@Component({
  selector: 'app-public-event-detail',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor, NgClass],
  templateUrl: './public-event-detail.html',
})
export class PublicEventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  event: PublicEventDetail | null = null;
  activeTab: 'details' | 'media' | 'artists' = 'details';
  showAllSchedules = false;

  async ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.error = 'Event not found.';
      this.isLoading = false;
      return;
    }

    try {
      this.event = await this.supabase.getPublicEventDetail(eventId);
      if (!this.event) {
        this.error = 'Event not found.';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Event could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  setTab(tab: 'details' | 'media' | 'artists') {
    this.activeTab = tab;
  }

  formatArtists(names: string[]): string {
    if (names.length === 0) {
      return 'Artist to be announced';
    }

    if (names.length === 1) {
      return names[0];
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  }

  get visibleScheduleLines(): string[] {
    if (!this.event) return [];
    return this.showAllSchedules ? this.event.schedule_lines : this.event.schedule_lines.slice(0, 3);
  }

  get hasMoreSchedules(): boolean {
    return (this.event?.schedule_lines.length ?? 0) > 3;
  }

  toggleSchedules() {
    this.showAllSchedules = !this.showAllSchedules;
  }
}
