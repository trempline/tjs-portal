import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

export type WorkspaceEditButtonVariant = 'primary' | 'inverse' | 'table' | 'icon';

@Component({
  selector: 'app-workspace-edit-button',
  standalone: true,
  imports: [NgIf],
  template: `
    <button
      type="button"
      [attr.title]="title || label"
      [attr.aria-label]="title || label"
      [disabled]="disabled"
      (click)="clicked.emit()"
      [class]="buttonClass"
    >
      <svg
        *ngIf="showIcon"
        class="h-4 w-4 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      <span *ngIf="variant !== 'icon'">{{ label }}</span>
    </button>
  `,
})
export class WorkspaceEditButton {
  @Input() label = 'Edit';
  @Input() title = '';
  @Input() variant: WorkspaceEditButtonVariant = 'primary';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();

  get showIcon(): boolean {
    return true;
  }

  get buttonClass(): string {
    const base = 'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

    switch (this.variant) {
      case 'inverse':
        return `${base} gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 focus:ring-zinc-300`;
      case 'table':
        return `${base} gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-300`;
      case 'icon':
        return `${base} rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus:ring-zinc-300`;
      case 'primary':
      default:
        return `${base} gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 focus:ring-zinc-500`;
    }
  }
}