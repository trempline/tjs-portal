import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { WorkspaceEditButton, WorkspaceEditButtonVariant } from './workspace-edit-button';
import { WorkspaceCancelButton } from './workspace-cancel-button';
import { WorkspaceSaveButton } from './workspace-save-button';

@Component({
  selector: 'app-workspace-edit-actions',
  standalone: true,
  imports: [NgIf, WorkspaceEditButton, WorkspaceCancelButton, WorkspaceSaveButton],
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <app-workspace-edit-button
        *ngIf="!isEditing && showEdit"
        [label]="editLabel"
        [variant]="variant"
        [disabled]="editDisabled"
        (clicked)="edit.emit()"
      />

      <ng-container *ngIf="isEditing">
        <ng-content select="[editActionsExtra]"></ng-content>
        <app-workspace-cancel-button
          *ngIf="showCancel"
          [label]="cancelLabel"
          [disabled]="isSaving || cancelDisabled"
          (clicked)="cancel.emit()"
        />
        <app-workspace-save-button
          [label]="saveLabel"
          [savingLabel]="savingLabel"
          [isSaving]="isSaving"
          [disabled]="saveDisabled"
          [type]="saveType"
          (clicked)="save.emit()"
        />
      </ng-container>
    </div>
  `,
})
export class WorkspaceEditActions {
  @Input() isEditing = false;
  @Input() isSaving = false;
  @Input() showEdit = true;
  @Input() showCancel = true;
  @Input() editDisabled = false;
  @Input() cancelDisabled = false;
  @Input() saveDisabled = false;
  @Input() editLabel = 'Edit';
  @Input() cancelLabel = 'Cancel';
  @Input() saveLabel = 'Save';
  @Input() savingLabel = 'Saving...';
  @Input() variant: WorkspaceEditButtonVariant = 'primary';
  @Input() saveType: 'button' | 'submit' = 'button';

  @Output() edit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}