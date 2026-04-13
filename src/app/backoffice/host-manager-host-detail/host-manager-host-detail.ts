import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { HostManagerService } from '../../services/host-manager.service';
import { TjsHost, TjsHostMember } from '../../services/supabase.service';

@Component({
  selector: 'app-host-manager-host-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-manager-host-detail.html',
  styleUrl: './host-manager-host-detail.scss'
})
export class HostManagerHostDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private hostManagerService = inject(HostManagerService);

  isLoading = true;
  error = '';
  host: TjsHost | null = null;
  hostMembers: TjsHostMember[] = [];
  hostEvents: Array<{ id: string; title: string; status: string; event_dates: string[] | null; location_name: string | null }> = [];
  hostArtists: Array<{ artist_id: string; artist_name: string; event_count: number }> = [];

  async ngOnInit() {
    const hostId = this.route.snapshot.paramMap.get('id');
    if (!hostId) {
      this.error = 'Host not found.';
      this.isLoading = false;
      return;
    }

    try {
      const details = await lastValueFrom(this.hostManagerService.getHostDetails(hostId));
      this.host = details.host;
      this.hostMembers = details.members;
      this.hostEvents = details.events;
      this.hostArtists = details.artists;

      if (!details.host) {
        this.error = 'Host not found.';
      }
    } catch (err) {
      console.error('Error loading host details:', err);
      this.error = 'Failed to load host details';
    } finally {
      this.isLoading = false;
    }
  }

  trackByMember(_: number, member: TjsHostMember) {
    return member.id;
  }

  trackByEvent(_: number, event: { id: string }) {
    return event.id;
  }

  trackByArtist(_: number, artist: { artist_id: string }) {
    return artist.artist_id;
  }
}
