import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImagePreviewOverlay } from './shared/image-preview/image-preview-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ImagePreviewOverlay],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('web');
}
