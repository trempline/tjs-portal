import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-workspace-cancel-button',
  standalone: true,
  template: `
    <button
      type="button"
      [disabled]="disabled"
      (click)="clicked.emit()"
      class="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {{ label }}
    </button>
  `,
})
export class WorkspaceCancelButton {
  @Input() label = 'Cancel';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();
}