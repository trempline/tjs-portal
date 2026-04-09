import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-artist-workspace-page',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900">{{ title }}</h1>
        <p class="mt-0.5 text-sm text-zinc-500">{{ description }}</p>
      </div>

      <div class="rounded-xl border border-zinc-200 bg-white p-12 shadow-sm">
        <div class="flex flex-col items-center justify-center text-center text-zinc-400">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <svg class="h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 3v18"></path>
              <path d="M3 12h18"></path>
            </svg>
          </div>
          <p class="mt-4 text-sm font-medium text-zinc-700">{{ title }}</p>
          <p class="mt-1 text-xs">This artist workspace section is ready for the next feature pass.</p>
        </div>
      </div>
    </div>
  `,
})
export class ArtistWorkspacePage {
  private route = inject(ActivatedRoute);

  get title(): string {
    return this.route.snapshot.data['title'] ?? 'Artist Workspace';
  }

  get description(): string {
    return this.route.snapshot.data['description'] ?? 'Manage your artist workspace.';
  }
}
