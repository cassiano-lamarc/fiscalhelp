import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export const notificationDurations = { info: 5000, error: 8000 };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);
  private previous = '';
  private shownAt = 0;
  show(message: string, kind: 'info' | 'error' = 'info') {
    if (!message || (message === this.previous && Date.now() - this.shownAt < 1000)) return;
    this.previous = message;
    this.shownAt = Date.now();
    this.snack.open(message, 'Fechar', {
      duration: notificationDurations[kind],
      horizontalPosition: 'center', verticalPosition: 'top',
      politeness: kind === 'error' ? 'assertive' : 'polite',
      panelClass: 'fiscal-notification',
    });
  }
}
