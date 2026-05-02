import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { UserService } from '../../../../services/user-service';
import {TableColumn, User} from '../../../../common/interfaces/interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormValidators } from '../../../../Validators/FormValidators';
import { NgClass } from '@angular/common';
import {UiService} from '../../../../services/ui-service';
import {GenericTable} from '../../../shared/generic-table/generic-table';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgClass, GenericTable],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly ui: UiService = inject(UiService);

  users = signal<User[]>([]);
  me = signal<User | null>(null);
  isEditing = signal(false);
  selectedUserId = signal<number | null>(null);
  searchQuery = signal<string>('');

  columns: TableColumn<User>[] = [
    {label: 'Empleado', key: 'name', subKey: 'email', type: 'avatar', sortable: true},
    {label: 'Rol', key: 'type', type: 'badge', sortable: true},
    {label: 'Estado', key: 'active', type: 'status', sortable: true},
    {label: 'Registro', key: 'created_at', type: 'date', sortable: true},
    {label: 'Acciones', key: 'actions', type: 'actions'}
  ];


  filteredData = computed(() => {
    const currentMe = this.me();
    const query = this.searchQuery().toLowerCase();

    return this.users().filter(u => {
      const isNotMe = u.id !== currentMe?.id;
      const matchesQuery = u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      return isNotMe && matchesQuery;
    });
  });

  formUsers: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40), FormValidators.nonOnlyWhiteSpace]],
    email: ['', [Validators.required, Validators.email, FormValidators.emailDominio('empresa.com')]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    type: ['', [Validators.required]]
  });

  get u() {
    return this.formUsers.controls;
  }

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
      next: (data: User[]) => this.users.set(data)
    });
  }

  openAddModal() {
    this.isEditing.set(false);
    this.selectedUserId.set(null);
    this.formUsers.reset({name: '', email: '', password: '', type: ''});
    this.updatePasswordValidators(true);
  }

  openEditModal(user: User) {
    this.isEditing.set(true);
    this.selectedUserId.set(user.id!);
    this.updatePasswordValidators(false);
    this.formUsers.patchValue({
      name: user.name,
      email: user.email,
      type: user.type,
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
    if (this.formUsers.invalid) {
      this.formUsers.markAllAsTouched();
      this.ui.handleError('Por favor, revisa los campos en rojo');
      return;
    }

    const userData = {...this.formUsers.value};
    const id = this.selectedUserId();

    if (id && !userData.password) delete userData.password;

    const request = id
      ? this.userService.updateUser(id, userData)
      : this.userService.createUser(userData);

    request.subscribe({
      next: () => {
        this.loadUsers();
        this.ui.notify(id ? 'Usuario actualizado' : 'Usuario creado');
      },
      error: error => this.ui.handleError(error)
    });
  }

  async onArchive(id: number) {
    const confirmed = await this.ui.confirm('¿Deseas cambiar el estado de este usuario?');
    if (confirmed) {
      this.userService.toggleUserStatus(id).subscribe({
        next: () => {
          this.loadUsers();
          this.ui.notify('Estado actualizado');
        },
        error: (err) => this.ui.handleError('Error al cambiar estado', err)
      });
    }

  }

  protected readonly String = String;
}
