import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  displayCopyrightText,
  MAX_COPYRIGHT_TEXT_LENGTH,
  normalizeCopyrightInput,
} from '../image-copyright/image-copyright.util';

export interface CroppedImageResult {
  file: File;
  copyright: string;
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Drop-in picture editor: drag & drop or browse, reposition by dragging, zoom,
 * and set the copyright holder — all before the upload happens.
 */
@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title"
        (click)="requestClose()"
      >
        <div
          class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
            <div>
              <h2 class="text-lg font-semibold text-zinc-900">{{ title }}</h2>
              <p class="mt-0.5 text-sm text-zinc-500">{{ hint }}</p>
            </div>
            <button
              type="button"
              (click)="requestClose()"
              aria-label="Close"
              class="-mr-1 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-5 px-6 py-5">
            @if (error) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
            }

            @if (!sourceUrl) {
              <label
                class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors"
                [class.border-red-400]="isDraggingFile"
                [class.bg-red-50]="isDraggingFile"
                [class.border-zinc-300]="!isDraggingFile"
                [class.hover:border-red-300]="!isDraggingFile"
                [class.hover:bg-zinc-50]="!isDraggingFile"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
              >
                <svg class="h-10 w-10 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <path d="m7 10 5-5 5 5"></path>
                  <path d="M12 5v12"></path>
                </svg>
                <div>
                  <div class="text-sm font-semibold text-zinc-800">Drop an image here, or click to browse</div>
                  <div class="mt-1 text-xs text-zinc-500">JPG, PNG or WebP · up to 8 MB</div>
                </div>
                <input type="file" accept="image/*" class="hidden" (change)="onFileInput($event)" />
              </label>
            } @else {
              <div class="flex flex-col items-center gap-4">
                <div
                  class="relative touch-none overflow-hidden bg-zinc-900 shadow-inner"
                  [class.rounded-full]="shape === 'circle'"
                  [class.rounded-2xl]="shape !== 'circle'"
                  [style.width.px]="viewportWidth"
                  [style.height.px]="viewportHeight"
                  (pointerdown)="startDrag($event)"
                  (wheel)="onWheel($event)"
                >
                  <img
                    [src]="sourceUrl"
                    alt="Selected picture"
                    class="max-w-none select-none"
                    draggable="false"
                    [style.width.px]="displayWidth"
                    [style.height.px]="displayHeight"
                    [style.transform]="'translate(' + offsetX + 'px, ' + offsetY + 'px)'"
                    [style.cursor]="isDragging ? 'grabbing' : 'grab'"
                  />
                </div>

                <div class="w-full max-w-xs">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-medium text-zinc-500">Zoom</span>
                    <input
                      type="range"
                      class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-red-600"
                      [min]="minZoom"
                      [max]="maxZoom"
                      step="0.01"
                      [ngModel]="zoom"
                      (ngModelChange)="setZoom($event)"
                      aria-label="Zoom"
                    />
                  </div>
                  <p class="mt-2 text-center text-xs text-zinc-500">Drag the picture to reposition it.</p>
                </div>

                <button
                  type="button"
                  (click)="clearSelection()"
                  class="text-xs font-semibold text-red-600 transition-colors hover:text-red-700"
                >
                  Choose another picture
                </button>
              </div>
            }

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-zinc-700">Copyright holder</label>
              <div class="flex items-center rounded-xl border border-zinc-300 px-3 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <span class="text-sm font-semibold text-zinc-400">&#64;</span>
                <input
                  [(ngModel)]="copyright"
                  type="text"
                  [maxlength]="maxCopyrightLength"
                  placeholder="Photographer name"
                  class="w-full bg-transparent py-2.5 pl-1 text-sm outline-none"
                />
              </div>
              <p class="text-xs text-zinc-500">
                Shown on the picture as {{ copyrightPreview }}. Leave empty to show just &#169;.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
            <button
              type="button"
              (click)="requestClose()"
              class="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirm()"
              [disabled]="!sourceUrl || isSaving"
              class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSaving ? 'Saving...' : saveLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ImageCropperModal {
  /** Opening always starts from a clean slate; closing releases the loaded file. */
  @Input()
  set open(value: boolean) {
    if (value === this.isOpen) {
      return;
    }

    this.isOpen = value;
    this.releaseSource();
    this.error = '';

    if (value) {
      this.copyright = this.savedCopyright;
    }
  }

  get open(): boolean {
    return this.isOpen;
  }

  @Input() title = 'Update picture';
  @Input() hint = 'Position and zoom the picture, then save.';
  @Input() saveLabel = 'Save picture';
  @Input() shape: 'circle' | 'rect' = 'circle';
  /** Width / height of the crop frame. */
  @Input() aspectRatio = 1;
  /** Crop frame width on screen, in pixels. */
  @Input() viewportWidth = 300;
  /** Width of the exported image, in pixels. */
  @Input() outputWidth = 640;
  @Input() isSaving = false;

  @Input()
  set initialCopyright(value: string | null | undefined) {
    this.savedCopyright = normalizeCopyrightInput(value);
    this.copyright = this.savedCopyright;
  }

  @Output() save = new EventEmitter<CroppedImageResult>();
  @Output() cancel = new EventEmitter<void>();

  readonly maxCopyrightLength = MAX_COPYRIGHT_TEXT_LENGTH;
  readonly minZoom = MIN_ZOOM;
  readonly maxZoom = MAX_ZOOM;

  copyright = '';
  error = '';
  isDraggingFile = false;
  isDragging = false;
  zoom = MIN_ZOOM;
  offsetX = 0;
  offsetY = 0;
  sourceUrl: string | null = null;

  private isOpen = false;
  private savedCopyright = '';
  private sourceImage: HTMLImageElement | null = null;
  private sourceName = 'picture.jpg';
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOriginX = 0;
  private dragOriginY = 0;

  get viewportHeight(): number {
    return Math.round(this.viewportWidth / (this.aspectRatio || 1));
  }

  get displayWidth(): number {
    return (this.sourceImage?.naturalWidth ?? 0) * this.displayScale;
  }

  get displayHeight(): number {
    return (this.sourceImage?.naturalHeight ?? 0) * this.displayScale;
  }

  get copyrightPreview(): string {
    return displayCopyrightText(this.copyright);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.loadFile(file);
    }
  }

  onFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.loadFile(file);
    }
    input.value = '';
  }

  setZoom(value: number | string) {
    const nextZoom = Math.min(this.maxZoom, Math.max(this.minZoom, Number(value) || this.minZoom));
    // Keep the centre of the frame steady while zooming.
    const centreX = (this.viewportWidth / 2 - this.offsetX) / this.zoom;
    const centreY = (this.viewportHeight / 2 - this.offsetY) / this.zoom;

    this.zoom = nextZoom;
    this.offsetX = this.viewportWidth / 2 - centreX * nextZoom;
    this.offsetY = this.viewportHeight / 2 - centreY * nextZoom;
    this.clampOffsets();
  }

  onWheel(event: WheelEvent) {
    if (!this.sourceImage) {
      return;
    }

    event.preventDefault();
    this.setZoom(this.zoom - event.deltaY * 0.002);
  }

  startDrag(event: PointerEvent) {
    if (!this.sourceImage) {
      return;
    }

    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragOriginX = this.offsetX;
    this.dragOriginY = this.offsetY;
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) {
      return;
    }

    this.offsetX = this.dragOriginX + (event.clientX - this.dragStartX);
    this.offsetY = this.dragOriginY + (event.clientY - this.dragStartY);
    this.clampOffsets();
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  onPointerUp() {
    this.isDragging = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open) {
      this.requestClose();
    }
  }

  clearSelection() {
    this.releaseSource();
    this.error = '';
  }

  requestClose() {
    this.releaseSource();
    this.error = '';
    this.cancel.emit();
  }

  async confirm() {
    if (!this.sourceImage) {
      return;
    }

    const file = await this.renderCrop();
    if (!file) {
      this.error = 'The picture could not be processed. Please try another file.';
      return;
    }

    this.save.emit({ file, copyright: normalizeCopyrightInput(this.copyright) });
  }

  private loadFile(file: File) {
    this.error = '';

    if (!file.type.startsWith('image/')) {
      this.error = 'Please choose an image file.';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.error = 'That image is larger than 8 MB. Please choose a smaller file.';
      return;
    }

    this.releaseSource();

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      this.sourceImage = image;
      this.sourceUrl = objectUrl;
      this.sourceName = file.name || 'picture.jpg';
      this.zoom = MIN_ZOOM;
      this.centreImage();
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.error = 'That image could not be read. Please try another file.';
    };
    image.src = objectUrl;
  }

  private get baseScale(): number {
    const image = this.sourceImage;
    if (!image?.naturalWidth || !image.naturalHeight) {
      return 1;
    }

    return Math.max(this.viewportWidth / image.naturalWidth, this.viewportHeight / image.naturalHeight);
  }

  private get displayScale(): number {
    return this.baseScale * this.zoom;
  }

  private centreImage() {
    this.offsetX = (this.viewportWidth - this.displayWidth) / 2;
    this.offsetY = (this.viewportHeight - this.displayHeight) / 2;
    this.clampOffsets();
  }

  private clampOffsets() {
    this.offsetX = Math.min(0, Math.max(this.viewportWidth - this.displayWidth, this.offsetX));
    this.offsetY = Math.min(0, Math.max(this.viewportHeight - this.displayHeight, this.offsetY));
  }

  private renderCrop(): Promise<File | null> {
    const image = this.sourceImage;
    if (!image) {
      return Promise.resolve(null);
    }

    const outputHeight = Math.round(this.outputWidth / (this.aspectRatio || 1));
    const canvas = document.createElement('canvas');
    canvas.width = this.outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return Promise.resolve(null);
    }

    const scale = this.displayScale;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      image,
      -this.offsetX / scale,
      -this.offsetY / scale,
      this.viewportWidth / scale,
      this.viewportHeight / scale,
      0,
      0,
      this.outputWidth,
      outputHeight,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const name = this.sourceName.replace(/\.[^.]+$/, '') || 'picture';
          resolve(new File([blob], `${name}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.9,
      );
    });
  }

  private releaseSource() {
    if (this.sourceUrl) {
      URL.revokeObjectURL(this.sourceUrl);
    }

    this.sourceUrl = null;
    this.sourceImage = null;
    this.zoom = MIN_ZOOM;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.isDraggingFile = false;
  }
}
