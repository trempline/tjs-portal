import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hosts',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './hosts.html',
})
export class Hosts {
  hosts: any[] = [];

  searchQuery = '';

  get filteredHosts() {
    if (!this.searchQuery.trim()) return this.hosts;
    const q = this.searchQuery.toLowerCase();
    return this.hosts.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q)
    );
  }
}
