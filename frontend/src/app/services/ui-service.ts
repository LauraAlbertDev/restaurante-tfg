import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'danger'>('success');
  private timeoutId: any = null;

  private showToast(message: string, type: 'success' | 'danger'): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.toastMessage.set(message);
    this.toastType.set(type);

    this.timeoutId = setTimeout(() => {
      this.clearToast();
    }, 4000);
  }

  notify(message: string): void {
    this.showToast(message, 'success');
  }

  handleError(message: string, error?: any): void {
    if (error) {
      console.error('LOG_ERROR:', error);
    }

    let messageToShow = message;

    if (error && error.status === 400) {
      if (error.error?.detail) {
        if (typeof error.error.detail === 'string') {
          messageToShow = error.error.detail;
        }
        else if (Array.isArray(error.error.detail) && error.error.detail.length > 0) {
          messageToShow = error.error.detail[0].msg;
        }
      }
    }

    this.showToast(messageToShow, 'danger');
  }

  clearToast(): void {
    this.toastMessage.set(null);
  }

  async confirm(message: string): Promise<boolean> {
    return window.confirm(message);
  }
}
