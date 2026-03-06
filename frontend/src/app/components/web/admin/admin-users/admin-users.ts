import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../../services/user-service';
import { User } from '../../../../common/interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormValidators } from '../../../../Validators/FormValidators';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePipe, NgClass],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  users: User[] = [];
  me: any;
  isEditing: boolean = false;
  selectedUserId: number | null = null;

  formUsers: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40), FormValidators.nonOnlyWhiteSpace]],
    email: ['', [Validators.required, Validators.email, FormValidators.emailDominio('empresa.com')]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    type: ['', [Validators.required]]
  });

  get u() { return this.formUsers.controls; }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.me = res;
        this.loadUsers();
      },
      error: (err) => console.error('Error al cargar perfil:', err)
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users = data.filter(u => u.id !== this.me.id);
      }
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.selectedUserId = null;
    this.formUsers.reset({ type: '' });

    this.u['password'].setValidators([Validators.required, Validators.minLength(8)]);
    this.u['password'].updateValueAndValidity();
  }

  openEditModal(user: User) {
    this.isEditing = true;
    this.selectedUserId = user.id!;

    this.u['password'].setValidators([Validators.minLength(8)]);
    this.u['password'].updateValueAndValidity();

    this.formUsers.patchValue({
      name: user.name,
      email: user.email,
      password: '',
      type: user.type
    });
  }

  onSubmit() {
    if (this.formUsers.invalid) {
      this.formUsers.markAllAsTouched();
      return;
    }

    const userData = { ...this.formUsers.value };

    if (this.isEditing && !userData.password) {
      delete userData.password;
    }

    if (this.isEditing && this.selectedUserId) {
      this.userService.updateUser(this.selectedUserId, userData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleSuccess() {
    this.loadUsers();
  }

  private handleError(err: any) {
    console.error(err);
    if (err.error?.detail === 'EMAIL_EXISTS') {
      this.u['email'].setErrors({ emailExists: true });
    }
  }

  onArchive(id: number) {
    if (confirm('¿Estás seguro de que deseas cambiar el estado de este usuario?')) {
      this.userService.toggleUserStatus(id).subscribe(() => this.loadUsers());
    }
  }
}
