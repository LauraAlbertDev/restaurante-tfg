import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContactService } from '../../../../../services/contact-service';
import {UserComment} from '../../../../../common/interfaces';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './comments-edit.html',
})
export class CommentsEdit implements OnInit {
  @Input() id?: number;
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly router = inject(Router);

  formComment: FormGroup = this.initForm();
  idComment?: number;

  get f() { return this.formComment.controls; }

  ngOnInit() {
    if (this.id) {
      this.idComment = this.id;
      this.loadCommentData(this.idComment);
    }
  }

  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      tel: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required]],
      note: ['']
    });
  }

  private loadCommentData(id: number) {
    this.contactService.getCommentById(id).subscribe({
      next: (data) => this.formComment.patchValue(data),
      error: (err) => console.error('Error al cargar comentario', err)
    });
  }

  onSubmit() {
    if (this.formComment.invalid || !this.idComment) {
      this.formComment.markAllAsTouched();
      return;
    }

    const commentData: UserComment = this.formComment.value;

    this.contactService.updateComment(this.idComment, commentData).subscribe({
      next: () => this.navigateToDashboard(),
      error: (err) => this.handleError('Update failed', err)
    });
  }

  protected navigateToDashboard() {
    this.router.navigate(['/comments-list']);
  }


  private handleError(msg: string, err?: any) {
    console.error(msg, err);
  }

}
