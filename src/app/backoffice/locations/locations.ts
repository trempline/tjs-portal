import { Component } from '@angular/core';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900">Lieux</h1>
        <p class="text-sm text-zinc-500 mt-0.5">Gérez les lieux et espaces de spectacle.</p>
      </div>

      <div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-12">
        <div class="flex flex-col items-center justify-center text-zinc-400">
          <svg class="h-16 w-16 mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <p class="text-sm font-medium">Gestion des lieux</p>
          <p class="text-xs mt-1">Cette fonctionnalité sera disponible prochainement.</p>
        </div>
      </div>
    </div>
  `,
})
export class Locations {}