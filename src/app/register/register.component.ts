import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      retypePassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const retypePassword = control.get('retypePassword');

    if (password && retypePassword && password.value !== retypePassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  isFieldValid(field: string): boolean {
    const control = this.registerForm.get(field);
    return control ? control.valid && (control.dirty || control.touched) : false;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const userData = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      };

      this.http.post('http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/api/v1/auth/register', userData).subscribe(
        response => {
          console.log('User registered successfully', response);
          this.successMessage = 'Registration successful please login now!';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error => {
          console.error('Registration failed', error);
          if (error.status === 403) {
            this.errorMessage = 'Email already exists. Please try again.';
          } else {
            this.errorMessage = error.message || 'Registration failed. Please try again.';
          }
        }
      );
    } else {
      this.errorMessage = 'Please fill out all required fields correctly.';
    }
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}