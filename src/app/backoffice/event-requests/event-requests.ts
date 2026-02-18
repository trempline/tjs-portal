import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-event-requests',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './event-requests.html',
})
export class EventRequests {
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';

  requests: any[] = [
    // placeholder rows — will be replaced by real data
  ];

  setTab(tab: 'pending' | 'approved' | 'rejected') {
    this.activeTab = tab;
  }

  get filteredRequests() {
    return this.requests.filter((r) => r.status === this.activeTab);
  }
}
