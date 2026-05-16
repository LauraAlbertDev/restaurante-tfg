import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import {UserService} from '../../../../services/user-service';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-my-profile',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfile implements OnInit {
  private readonly userService = inject(UserService);
  private readonly ui = inject(UiService);
  private readonly fb = inject(FormBuilder);
  user = signal<any>(null);
  isSubmitting = signal<boolean>(false);

  profileForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.user.set(profile);
        this.profileForm.patchValue({
          email: profile.email
        });
      },
      error: (err) => {
        this.ui.handleError(err.error?.detail || 'Error al cargar los datos del perfil');
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.profileForm.value;
    const payload: any = { email: formValue.email };
    if (formValue.password && formValue.password.trim() !== '') {
      payload.password = formValue.password;
    }

    this.userService.updateProfile(payload).subscribe({
      next: () => {
        this.ui.notify('¡Perfil actualizado correctamente!');
        this.profileForm.get('password')?.reset();
        this.isSubmitting.set(false);
        this.loadUserProfile();
      },
      error: (err) => {
        this.ui.handleError(err.error?.detail || 'No se pudo actualizar el perfil');
        this.isSubmitting.set(false);
      }
    });
  }
}
