import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-workspace-save-button',
  standalone: true,
  imports: [NgIf],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || isSaving"
      (click)="onClick($event)"
      class="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        *ngIf="isSaving"
        class="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>{{ isSaving ? savingLabel : label }}</span>
    </button>
  `,
})
export class WorkspaceSaveButton {
  @Input() label = 'Save';
  @Input() savingLabel = 'Saving...';
  @Input() isSaving = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Output() clicked = new EventEmitter<void>();

  onClick(event: Event) {
    if (this.type === 'submit') {
      return;
    }

    event.preventDefault();
    this.clicked.emit();
  }
}