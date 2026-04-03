import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class FileService {
  // Método genérico y reutilizable
  downloadBlob(data: Blob, fileName: string) {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}