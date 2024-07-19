import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface LoginResponse {
  token: string;
  id: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  isFieldValid(field: string): boolean {
    const control = this.loginForm.get(field);
    return control ? control.valid && (control.dirty || control.touched) : false;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const loginData = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.http.post<LoginResponse>('http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/api/v1/auth/login', loginData).subscribe(
        response => {
          console.log('Login successful', response);
          this.successMessage = 'Login successful!';
          setTimeout(() => {
            localStorage.setItem('token', response.token);
            localStorage.setItem('id', response.id.toString());
            window.location.reload();
          }, 1500);
          this.router.navigate(['/checker']);
        },
        error => {
          console.error('Login failed', error);
          this.errorMessage = 'Invalid email or password. Please try again.';
        }
      );
    } else {
      this.errorMessage = 'Please fill out all required fields.';
    }
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}