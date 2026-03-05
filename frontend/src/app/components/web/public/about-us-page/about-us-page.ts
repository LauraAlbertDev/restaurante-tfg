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
export class AboutUsPage implements OnInit {

  private readonly philosophyService = inject(PhilosophyService);
  private readonly formBuilder = inject(FormBuilder);

  philosophies: Philosophy[] = [];
  me: any;

  editForm!: FormGroup;
  selectedPhilosophyId!: number;

  get icon() { return this.editForm.get('icon'); }
  get title() { return this.editForm.get('title'); }
  get message() { return this.editForm.get('message'); }

  ngOnInit(): void {


    this.loadPhilosophies();

    this.editForm = this.formBuilder.group({
      icon: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  private loadPhilosophies(): void {
    this.philosophyService
      .getPhilosophies()
      .subscribe(data => this.philosophies = data);
  }

  openEditModal(philosophy: Philosophy): void {
    this.selectedPhilosophyId = philosophy.id;

    this.editForm.patchValue({
      icon: philosophy.icon,
      title: philosophy.title,
      message: philosophy.message
    });

    const modalElement = document.getElementById('editModal');
    if (!modalElement) return;

    const modal = new Modal(modalElement);
    modal.show();
  }


  save(): void {
    if (this.editForm.invalid) return;

    this.philosophyService
      .updatePhilosophy(this.selectedPhilosophyId, this.editForm.value)
      .subscribe(updated => {

        const index = this.philosophies.findIndex(
          p => p.id === updated.id
        );

        if (index !== -1) {
          this.philosophies[index] = updated;
        }

        const modalElement = document.getElementById('editModal');
        if (!modalElement) return;

        const modalInstance = Modal.getInstance(modalElement);
        modalInstance?.hide();
      });
  }



}
