import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../services/auth-service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private auth = inject(AuthService);

  login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, rellena todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        console.log("Login exitoso para:", res.name);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales incorrectas. Inténtalo de nuevo.';
        console.error("Login Error:", err);
      }
    });
  }
}
