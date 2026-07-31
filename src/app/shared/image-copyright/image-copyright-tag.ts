import { Component, Input } from '@angular/core';
import { displayCopyrightText } from './image-copyright.util';

export type ImageCopyrightPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Copyright credit written straight onto the media — no box, no label.
 * Shows "@Holder" when a holder is set, otherwise the bare © symbol.
 */
@Component({
  selector: 'app-image-copyright-tag',
  standalone: true,
  template: `
    @if (label) {
      <span [class]="tagClass" aria-label="Media copyright">{{ label }}</span>
    }
  `,
})
export class ImageCopyrightTag {
  @Input() copyrightText: string | null | undefined = null;
  @Input() position: ImageCopyrightPosition = 'bottom-right';
  /** Slightly larger credit for hero-sized media. */
  @Input() size: 'sm' | 'md' = 'sm';

  get label(): string {
    return displayCopyrightText(this.copyrightText);
  }

  get tagClass(): string {
    return [
      'pointer-events-none absolute z-10 select-none font-medium leading-none text-white',
      '[text-shadow:0_1px_4px_rgba(0,0,0,0.95),0_0_1px_rgba(0,0,0,0.9)]',
      this.size === 'md' ? 'text-xs sm:text-sm' : 'text-[11px]',
      this.positionClass,
    ].join(' ');
  }

  private get positionClass(): string {
    switch (this.position) {
      case 'bottom-left':
        return 'bottom-2 left-2.5';
      case 'top-right':
        return 'top-2 right-2.5';
      case 'top-left':
        return 'top-2 left-2.5';
      default:
        return 'bottom-2 right-2.5';
    }
  }
}
