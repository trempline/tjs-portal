import { Component, HostListener, inject } from '@angular/core';
import { ImageCopyrightTag } from '../image-copyright/image-copyright-tag';
import { ImagePreviewService } from './image-preview.service';

@Component({
  selector: 'app-image-preview-overlay',
  standalone: true,
  imports: [ImageCopyrightTag],
  template: `
    @if (preview(); as activePreview) {
      <div
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        (click)="close()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="activePreview.alt"
      >
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close image preview"
          (click)="close(); $event.stopPropagation()"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>

        <div class="relative max-h-[90vh] max-w-[92vw]" (click)="$event.stopPropagation()">
          <img
            [src]="activePreview.imageUrl"
            [alt]="activePreview.alt"
            class="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
          />
          <app-image-copyright-tag [copyrightText]="activePreview.copyrightText"></app-image-copyright-tag>
        </div>
      </div>
    }
  `,
})
export class ImagePreviewOverlay {
  private readonly previewService = inject(ImagePreviewService);

  readonly preview = this.previewService.preview;

  constructor() {
    this.previewService.attachGlobalPreviewListener();
  }

  close(): void {
    this.previewService.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.preview()) {
      this.close();
    }
  }
}