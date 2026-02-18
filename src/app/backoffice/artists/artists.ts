import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [NgFor, NgIf, RouterModule],
  templateUrl: './artists.html',
})
export class Artists {
  activeTab: 'tjs' | 'invited' = 'tjs';

  tjsArtists: any[] = [];
  invitedArtists: any[] = [];

  setTab(tab: 'tjs' | 'invited') {
    this.activeTab = tab;
  }

  get currentArtists() {
    return this.activeTab === 'tjs' ? this.tjsArtists : this.invitedArtists;
  }
}
