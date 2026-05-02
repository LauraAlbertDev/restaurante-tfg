import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  notify(message: string): void {
    alert(`✅ ${message}`);
  }

  handleError(message: string, error?: any): void {
    if (error) {
      console.error('LOG_ERROR:', error);
    }
    alert(` ${message}`);
  }

  async confirm(message: string): Promise<boolean> {
    return window.confirm(message);
  }
}
