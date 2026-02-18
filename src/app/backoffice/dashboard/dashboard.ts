import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, NgFor, NgIf],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  stats = [
    { label: 'Demandes en attente', value: 0, color: 'bg-amber-500', icon: 'request' },
    { label: 'Artistes TJS', value: 0, color: 'bg-blue-600', icon: 'artists' },
    { label: 'Hôtes enregistrés', value: 0, color: 'bg-emerald-600', icon: 'hosts' },
    { label: 'Événements à venir', value: 0, color: 'bg-red-600', icon: 'events' },
  ];
}
