import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { HostManagerService } from '../../services/host-manager.service';
import { AuthService } from '../../services/auth.service';
import { TjsHost } from '../../services/supabase.service';

@Component({
  selector: 'app-host-manager-hosts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './host-manager-hosts.html',
  styleUrl: './host-manager-hosts.scss'
})
export class HostManagerHosts implements OnInit {
  private hostManagerService = inject(HostManagerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  searchQuery = '';

  hosts: TjsHost[] = [];

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get filteredHosts(): TjsHost[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.hosts;
    }

    return this.hosts.filter((host) =>
      [
        host.name,
        host.public_name,
        host.address,
        host.city,
        host.country,
        host.contact_email,
        host.contact_phone1,
      ]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(query))
    );
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
      this.hosts = await lastValueFrom(this.hostManagerService.getAssignedHosts(userId));
    } catch (err) {
      console.error('Error loading hosts:', err);
      this.error = 'Failed to load hosts';
    } finally {
      this.isLoading = false;
    }
  }

  async openHost(host: TjsHost) {
    await this.router.navigate(['/backoffice/host-manager/hosts', host.id]);
  }

  trackByHost(_: number, host: TjsHost) {
    return host.id;
  }
}
