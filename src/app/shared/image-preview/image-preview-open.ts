import { Component, Input, inject } from '@angular/core';
import { ImagePreviewService } from './image-preview.service';

@Component({
  selector: 'app-image-preview-open',
  standalone: true,
  template: `
    @if (imageUrl) {
      <button
        type="button"
        class="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        [class]="buttonClass"
        (click)="openPreview()"
      >
        {{ label }}
      </button>
    }
  `,
})
export class ImagePreviewOpen {
  private readonly previewService = inject(ImagePreviewService);

  @Input() imageUrl: string | null | undefined = null;
  @Input() alt = 'Image preview';
  @Input() copyrightText: string | null | undefined = null;
  @Input() label = 'Preview image';
  @Input() buttonClass = '';

  openPreview(): void {
    if (!this.imageUrl) {
      return;
    }

    this.previewService.open(this.imageUrl, {
      alt: this.alt,
      copyrightText: this.copyrightText ?? null,
    });
  }
}