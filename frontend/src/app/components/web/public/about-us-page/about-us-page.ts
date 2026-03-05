import { Component, inject, OnInit } from '@angular/core';
import { Philosophy } from '../../../../common/interfaces';
import { Modal } from 'bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {PhilosophyService} from '../../../../services/philosophy-service';

@Component({
  selector: 'app-about-us-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './about-us-page.html',
  styleUrl: './about-us-page.css',
})
export class AboutUsPage implements  OnInit {
  private readonly philosophyService = inject(PhilosophyService);
  private readonly fb = inject(FormBuilder);

  philosophies: Philosophy[] = [];
  editForm: FormGroup = this.initForm();
  selectedPhilosophyId: number | null = null;
  private modalInstance: Modal | null = null;

  get f() { return this.editForm.controls; }


  ngOnInit(): void {
    this.loadPhilosophies();
  }

  private initForm(): FormGroup {
    return this.fb.group({
      icon: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  loadPhilosophies(): void {
    this.philosophyService.getPhilosophies().subscribe({
      next: (data) => this.philosophies = data,
      error: (err) => console.error("Error cargando filosofías", err)
    });
  }

  openEditModal(philosophy: Philosophy): void {
    this.selectedPhilosophyId = philosophy.id;
    this.editForm.patchValue(philosophy);

    const el = document.getElementById('editModal');
    if (el) {
      this.modalInstance = new Modal(el);
      this.modalInstance.show();
    }
  }

  save(): void {
    if (this.editForm.invalid || !this.selectedPhilosophyId) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.philosophyService
      .updatePhilosophy(this.selectedPhilosophyId, this.editForm.value)
      .subscribe({
        next: (updated) => {
          // Actualización inmutable del array (Clean Code)
          this.philosophies = this.philosophies.map(p =>
            p.id === updated.id ? updated : p
          );
          this.modalInstance?.hide();
        },
        error: (err) => alert("Error al guardar: " + err.message)
      });
  }
}
