import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../shared/shared-module';
import { SupabaseService, PublicEventDetail } from '../services/supabase.service';

@Component({
  selector: 'app-public-event-detail',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor],
  templateUrl: './public-event-detail.html',
})
export class PublicEventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  error = '';
  event: PublicEventDetail | null = null;
  showAllSchedules = false;

  async ngOnInit() {
    await this.authService.waitForAuthReady();
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
      } else if (this.event.is_member_only && !this.canAccessMemberOnlyEvents) {
        this.event = null;
        this.error = 'This event is restricted to logged-in members.';
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

  get heroEyebrow(): string {
    if (!this.event) {
      return 'Event';
    }

    return this.event.event_domain_name || this.event.event_type_name || 'Event';
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

  private parseScheduleLine(line: string): { datePart: string; timePart: string; locationPart: string } {
    const parts = line.split('|').map(part => part.trim());
    const dateTimePart = parts[0] || '';
    const locationPart = parts[1] || '';

    const separatorIndex = dateTimePart.lastIndexOf(' : ');
    const datePart = separatorIndex >= 0 ? dateTimePart.slice(0, separatorIndex).trim() : dateTimePart;
    const timePart = separatorIndex >= 0 ? dateTimePart.slice(separatorIndex + 3).trim() : '';

    return { datePart, timePart, locationPart };
  }

  formatScheduleLine(line: string): string {
    const { datePart, timePart, locationPart } = this.parseScheduleLine(line);
    let formatted = `📅 ${datePart}`;

    if (timePart) {
      formatted += ` • 🕐 ${timePart}`;
    }

    return formatted;
  }

  scheduleLocation(line: string): string {
    return this.toTitleCase(this.parseScheduleLine(line).locationPart);
  }

  hasScheduleLocation(line: string): boolean {
    return !!this.parseScheduleLine(line).locationPart;
  }

  private toTitleCase(value: string): string {
    return value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
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

  get hasCallToAction(): boolean {
    return !!this.event?.call_to_action_url?.trim();
  }

  get canAccessMemberOnlyEvents(): boolean {
    return this.authService.hasValidMembership
      || this.authService.isAdmin
      || this.authService.isCommitteeMember
      || this.authService.isHostManager
      || this.authService.hasAnyRole(['Host', 'Host+'])
      || this.authService.isArtist;
  }
}
