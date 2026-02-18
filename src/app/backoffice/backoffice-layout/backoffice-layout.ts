import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterModule, NgIf, NgFor],
  templateUrl: './backoffice-layout.html',
})
export class BackofficeLayout implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sub?: Subscription;

  sidebarCollapsed = false;
  displayName = 'Admin';
  avatarLetter = 'A';
  userEmail = '';
  userRoles: string[] = [];
  isAdmin = false;

  expandedMenus: Set<string> = new Set();

  ngOnInit() {
    this.sub = this.authService.state$.subscribe(state => {
      this.displayName = this.authService.displayName;
      this.avatarLetter = this.authService.avatarLetter;
      this.userEmail = state.user?.email ?? '';
      this.userRoles = state.roles.map(r => r.name);
      this.isAdmin = this.authService.isAdmin;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleSubmenu(label: string) {
    if (this.expandedMenus.has(label)) {
      this.expandedMenus.delete(label);
    } else {
      this.expandedMenus.add(label);
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedMenus.has(label);
  }

  async logout() {
    await this.authService.signOut();
  }
}
