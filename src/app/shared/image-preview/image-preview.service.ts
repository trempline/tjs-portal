import { Injectable, signal } from '@angular/core';

export interface ImagePreviewState {
  imageUrl: string;
  alt: string;
  copyrightText: string | null;
}

@Injectable({ providedIn: 'root' })
export class ImagePreviewService {
  readonly preview = signal<ImagePreviewState | null>(null);
  private listenerAttached = false;

  attachGlobalPreviewListener(): void {
    if (this.listenerAttached || typeof document === 'undefined') {
      return;
    }

    document.addEventListener('click', this.handleDocumentClick, true);
    this.listenerAttached = true;
  }

  open(imageUrl: string, options?: { alt?: string; copyrightText?: string | null }): void {
    const url = imageUrl?.trim();
    if (!url) {
      return;
    }

    this.preview.set({
      imageUrl: url,
      alt: options?.alt?.trim() || 'Image preview',
      copyrightText: options?.copyrightText?.trim() || null,
    });
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.preview.set(null);
    document.body.style.overflow = '';
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) {
      return;
    }

    if (this.shouldSkipPreview(target)) {
      return;
    }

    const imageUrl = target.currentSrc || target.src;
    if (!imageUrl?.trim()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.open(imageUrl, {
      alt: target.alt,
      copyrightText: target.getAttribute('data-preview-copyright'),
    });
  };

  private shouldSkipPreview(image: HTMLImageElement): boolean {
    if (image.hasAttribute('data-no-image-preview')) {
      return true;
    }

    if (image.closest('[data-no-image-preview]')) {
      return true;
    }

    if (image.closest('app-header, app-footer')) {
      return true;
    }

    if (image.closest('label')) {
      return true;
    }

    const src = image.currentSrc || image.src;
    if (!src || src === window.location.href) {
      return true;
    }

    return false;
  }
}