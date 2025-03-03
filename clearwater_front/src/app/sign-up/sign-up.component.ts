import { Component, OnInit } from '@angular/core';
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit() {}


  // createProfile(){
  //   this.http.get('localhost:3000/users/signup')
  //     .subscribe(data => {
  //     // Handle the response data
  //     alert(data)
  // });
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  onEmailBlur(event: Event): void {
    const emailInput = event.target as HTMLInputElement;
    const email = emailInput.value;

    if (!this.validateEmail(email)) {
      emailInput.classList.add('invalid-input'); // Add the 'invalid-input' class
    } else {
      emailInput.classList.remove('invalid-input'); // Remove the 'invalid-input' class if valid
    }
  }

  createProfile() {
    console.log('create-profile function initiated');
    const headers = new HttpHeaders({
      'myHeader': 'main',
      'Content-Type': 'application/json',
      'Authorization': 'my-auth-token',
      'Access-Control-Allow-Origin': 'http://localhost:4200, http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      observe: 'body',
      responseType: 'json'
    });
  
    console.log('http request initiated');
    const firstname = (<HTMLInputElement>document.getElementById('firstname')).value;
    const lastname = (<HTMLInputElement>document.getElementById('lastname')).value;
    const username = (<HTMLIonInputElement>document.getElementById('Username')).value;
    const emailInput = <HTMLInputElement>document.getElementById('Email');
    const email = emailInput.value;
    const phonenumber = (<HTMLInputElement>document.getElementById('Phone')).value;
    const password = (<HTMLIonInputElement>document.getElementById('Password')).value;
    const zip = (<HTMLInputElement>document.getElementById('Zip')).value;
  
    // Validate email format
    if (!this.validateEmail(email)) {
      alert('Invalid email address. Please enter a valid email.');
      emailInput.classList.add('invalid-input');
      return;
    }
  
    this.http.post<{ [account_creation: string]: any }>(
      'http://localhost:3000/users/signup',
      {
        firstName: firstname,
        lastName: lastname,
        username: username,
        email: email,
        phonenumber: phonenumber,
        password: password,
        zip: zip,
        responseType: 'application/json'
      },
      { headers: headers }
    ).subscribe((res) => {
      console.log(res.account_creation);
      if (res.account_creation === 'success') {
        alert('Account created successfully. Please verify your email.');
        window.location.href = `/welcome/login`; // Redirect to the verification page //verify-email?email=${email}
      }
  
      if (res.account_creation === 'failure') {
        alert('Failed to create account. Please try again.');
      }
    });
  }
  


  }


