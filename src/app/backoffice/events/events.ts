import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './events.html',
})
export class Events {
  activeTab: 'upcoming' | 'past' = 'upcoming';

  events: any[] = [];

  setTab(tab: 'upcoming' | 'past') {
    this.activeTab = tab;
  }

  get filteredEvents() {
    return this.events.filter((e) => e.type === this.activeTab);
  }
}
