import {Component, inject, OnInit} from '@angular/core';
import {UserComment} from '../../../../../common/interfaces';
import {ContactService} from '../../../../../services/contact-service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-comments-list',
  imports: [
    RouterLink
  ],
  templateUrl: './comments-list.html',
  styleUrl: './comments-list.css',
})
export class CommentsList implements OnInit {
  comments: UserComment[] = [];
  private readonly contactService = inject(ContactService);

  showArchived = false;

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.contactService.getComments(this.showArchived).subscribe({
      next: (data) => {
        this.comments = data;
        console.log('Comentarios recibidos:', this.comments);
      },
      error: (err) => {
        console.error('Error:', err);
        this.comments = [];
      }
    });
  }

  toggleArchive(id: number, archived: boolean) {
    const msg = archived ? "¿Restaurar comentario?" : "¿Archivar comentario?";
    if (!confirm(msg)) return;

    this.contactService.toggleArchive(id).subscribe({
      next: () => {
        this.loadComments();
      },
      error: (err) => console.error(err)
    });
  }

  toggleViewArchived() {
    this.showArchived = !this.showArchived;
    this.loadComments();
  }

}
