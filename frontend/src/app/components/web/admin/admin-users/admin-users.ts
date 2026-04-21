import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { UserService } from '../../../../services/user-service';
import { User } from '../../../../common/interfaces/interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormValidators } from '../../../../Validators/FormValidators';
import { DatePipe, NgClass } from '@angular/common';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePipe, NgClass],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb : FormBuilder = inject(FormBuilder);
  private readonly ui : UiService = inject(UiService);

  users = signal<User[]>([]);
  me = signal<User | null>(null);
  isEditing = signal(false);
  selectedUserId = signal<number | null>(null);

  filteredUsers = computed(() => {
    const currentMe = this.me();
    return this.users().filter(u => u.id !== currentMe?.id);
  });

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
    this.userService.getProfile().subscribe(res => {
      this.me.set(res);
      this.loadUsers();
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users.set(data);
      }
    });
  }

  openAddModal() {
    this.isEditing.set(false);
    this.selectedUserId.set(null);
    this.formUsers.reset({
      name: '',
      email: '',
      password: '',
      type: '' // Esto selecciona el "-- Selecciona --"
    });
    this.updatePasswordValidators(true);
  }

  openEditModal(user: User) {
    console.log('Tipo recibido del servidor:', user.type);
    this.isEditing.set(true);
    this.selectedUserId.set(user.id!);
    this.updatePasswordValidators(false);

    this.formUsers.patchValue({
      name: user.name,
      email: user.email,
      type: user.type, // Asegúrate de que user.type sea exactamente 'admin', 'leader' o 'employee'
      password: ''
    });
  }

  private updatePasswordValidators(isRequired: boolean) {
    const passwordCtrl = this.u['password'];
    const validators = isRequired
      ? [Validators.required, Validators.minLength(8)]
      : [Validators.minLength(8)];
    passwordCtrl.setValidators(validators);
    passwordCtrl.updateValueAndValidity();
  }

  onSubmit() {
    console.log('Datos que se enviarán al servidor:', this.formUsers.value); // <--- MIRA LA CONSOLA
    if (this.formUsers.invalid) {
      this.formUsers.markAllAsTouched();
      this.ui.handleError('Por favor, revisa los campos en rojo');
      return;
    }

    const userData = { ...this.formUsers.value };

    // Debug: Mira si aquí el 'type' está presente
    if (!userData.type) {
      this.ui.handleError('Debes seleccionar un tipo de usuario');
      return;
    }

    const id = this.selectedUserId();

    // Si editamos y no hay pass, la borramos para no enviar "" al server
    if (id && !userData.password) {
      delete userData.password;
    }

    const request = id
      ? this.userService.updateUser(id, userData)
      : this.userService.createUser(userData);

    request.subscribe({
      next: () =>{
        this.loadUsers();
        this.ui.notify(id ? 'Usuario actualizado' : 'Usuario creado');
      },
      error: error => {this.ui.handleError(error);},
    })
  }


  async onArchive(id: number) {
    // Esperamos a que el usuario responda al modal/confirm
    const confirmed = await this.ui.confirm('¿Estás seguro de que deseas cambiar el estado de este usuario?');

    if (confirmed) {
      this.userService.toggleUserStatus(id).subscribe({
        next: () => {
          this.loadUsers();
          this.ui.notify('Estado actualizado correctamente');
        },
        error: (err) => this.ui.handleError('No se pudo cambiar el estado', err)
      });
    }
  }
}
