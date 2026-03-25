import { Component } from '@angular/core';

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900">Adhésion</h1>
        <p class="text-sm text-zinc-500 mt-0.5">Gérez les adhésions et cotisations des membres.</p>
      </div>

      <div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-12">
        <div class="flex flex-col items-center justify-center text-zinc-400">
          <svg class="h-16 w-16 mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p class="text-sm font-medium">Gestion des adhésions</p>
          <p class="text-xs mt-1">Cette fonctionnalité sera disponible prochainement.</p>
        </div>
      </div>
    </div>
  `,
})
export class Membership {}