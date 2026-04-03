import {Component, inject, signal, WritableSignal} from '@angular/core';
import {ContactService} from '../../../../services/contact-service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {UserComment} from '../../../../common/interfaces/interfaces';
import {FormValidators} from '../../../../Validators/FormValidators';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-contact-page',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.css',
})
export class ContactPage {
  private readonly contactService = inject(ContactService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly ui = inject(UiService);

  commentForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(20)]],
    tel: ['', [Validators.required, Validators.pattern(/^\d{9}$/), Validators.maxLength(40)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/\.(com|es|net)$/)]],
    message: ['', [Validators.required, Validators.maxLength(80)]],
    note: [''],
  });

  get f() { return this.commentForm.controls; }

  onSubmit() {
    if(this.commentForm.invalid){
      this.commentForm.markAllAsTouched();
      return;
    }

    const formValue = this.commentForm.getRawValue();

    const newComment: UserComment = {
      ...formValue,
      id: 0,
      archived: false,
      note: formValue.note || ''
    };

    this.contactService.postComment(newComment).subscribe({
      next: () => this.ui.notify('Comentario enviado con éxito'),
      error: (err) => this.ui.handleError('No se pudo enviar el comentario')
    });
  }
}
