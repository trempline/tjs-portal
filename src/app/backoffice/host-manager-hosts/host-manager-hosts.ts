import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HostManagerService } from '../../services/host-manager.service';
import { AuthService } from '../../services/auth.service';
import { lastValueFrom } from 'rxjs';
import { TjsHost } from '../../services/supabase.service';

@Component({
  selector: 'app-host-manager-hosts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-manager-hosts.html',
  styleUrl: './host-manager-hosts.scss'
})
export class HostManagerHosts implements OnInit {
  private hostManagerService = inject(HostManagerService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  isLoading = true;
  error = '';
  hosts: TjsHost[] = [];

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    const userId = this.currentUserId;
    if (!userId) {
      this.isLoading = false;
      return;
    }

    try {
      this.hosts = await lastValueFrom(
        this.hostManagerService.getAssignedHosts(userId)
      );
    } catch (err) {
      console.error('Error loading hosts:', err);
      this.error = 'Failed to load hosts';
    }

    this.isLoading = false;
  }
}