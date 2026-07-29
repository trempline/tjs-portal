import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../shared/shared-module';
import { ImageCopyrightTag } from '../shared/image-copyright/image-copyright-tag';
import { SupabaseService, PublicEventDetail, PublicEventScheduleItem } from '../services/supabase.service';
import { formatFrenchPublicDatePart, parsePublicScheduleLine } from '../shared/date-format/date-format.util';
import { hasPublicBookingUrl } from '../shared/booking-url/booking-url.util';

@Component({
  selector: 'app-public-event-detail',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor, NgTemplateOutlet, RouterLink, ImageCopyrightTag],
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

  formatHosts(names: string[]): string {
    if (names.length === 0) {
      return 'Host to be announced';
    }

    if (names.length === 1) {
      return names[0];
    }

    return names.join(', ');
  }

  heroArtistSeparator(index: number): string {
    const artists = this.event?.artists ?? [];
    if (index >= artists.length - 1) {
      return '';
    }

    if (artists.length === 2) {
      return ' & ';
    }

    if (index === artists.length - 2) {
      return ' & ';
    }

    return ', ';
  }

  hasArtistProfileLink(artist: PublicEventDetail['artists'][number]): boolean {
    return !!artist.id;
  }

  private parseScheduleLine(line: string): { datePart: string; timePart: string; locationPart: string } {
    return parsePublicScheduleLine(line);
  }

  formatScheduleLine(line: string): string {
    const { datePart, timePart } = this.parseScheduleLine(line);
    const formattedDate = formatFrenchPublicDatePart(datePart);
    let formatted = `📅 ${formattedDate}`;

    if (timePart) {
      formatted += ` • 🕐 ${timePart}`;
    }

    return formatted;
  }

  private scheduleItems(): PublicEventScheduleItem[] {
    if (!this.event) {
      return [];
    }

    if (this.event.schedule_items.length > 0) {
      return this.event.schedule_items;
    }

    return this.event.schedule_lines.map((line) => ({
      line,
      location_label: this.parseScheduleLine(line).locationPart || null,
      location_id: null,
    }));
  }

  scheduleLocation(item: PublicEventScheduleItem): string {
    const label = item.location_label || this.parseScheduleLine(item.line).locationPart;
    return this.toTitleCase(label);
  }

  hasScheduleLocation(item: PublicEventScheduleItem): boolean {
    const label = item.location_label || this.parseScheduleLine(item.line).locationPart;
    return !!label?.trim();
  }

  hasScheduleLocationLink(item: PublicEventScheduleItem): boolean {
    return !!item.location_id;
  }

  private toTitleCase(value: string): string {
    return value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  get visibleScheduleItems(): PublicEventScheduleItem[] {
    const items = this.scheduleItems();
    return this.showAllSchedules ? items : items.slice(0, 3);
  }

  get hasMoreSchedules(): boolean {
    return this.scheduleItems().length > 3;
  }

  toggleSchedules() {
    this.showAllSchedules = !this.showAllSchedules;
  }

  get hasCallToAction(): boolean {
    return hasPublicBookingUrl(this.event?.call_to_action_url);
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
