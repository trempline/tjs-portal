import { Component, Input } from '@angular/core';
import { displayCopyrightText } from './image-copyright.util';

@Component({
  selector: 'app-image-copyright-tag',
  standalone: true,
  template: `
    <span
      class="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm"
      aria-label="Image copyright"
    >
      {{ label }}
    </span>
  `,
})
export class ImageCopyrightTag {
  @Input() copyrightText: string | null | undefined = null;

  get label(): string {
    return displayCopyrightText(this.copyrightText);
  }
}