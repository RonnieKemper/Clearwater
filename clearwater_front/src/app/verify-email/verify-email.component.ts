import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  message: string = 'Verifying your email...';
  errors: string[] = [];  // Array to store errors

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Override console.error to capture errors and log them to errors array
    const originalConsoleError = console.error;
    console.error = (errorMessage: any) => {
      this.errors.push(errorMessage);  // Store errors in the errors array
      originalConsoleError.apply(console, arguments);  // Call the original console.error
    };

    // Extract token from URL
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.message = 'Invalid verification link.';
      return;
    }

    // Send the token to the backend for verification
    this.http.post<{ message: string }>('http://localhost:3000/users/verify-email', { token }, { withCredentials: true }).subscribe({
      next: (response) => {
        this.message = response.message || 'Email successfully verified! You can now log in.';
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          this.router.navigate(['/welcome/login']);
        }, 3000); // Redirect after 3 seconds
      },
      error: (err) => {
        this.message = 'Verification failed. The token may be invalid or expired.';
        console.error('Verification failed:', err);  // Log any error from HTTP request
      }
    });
  }
}
