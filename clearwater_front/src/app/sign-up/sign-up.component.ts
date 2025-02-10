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

  createProfile(){
    console.log('create-profile function initiated');
    const headers = new HttpHeaders({
      'myHeader': 'main',
      'Content-Type': 'application/json', //application/json //text/plain
      'Authorization': 'my-auth-token',
      'Access-Control-Allow-Origin': 'http://localhost:4200, http://localhost:3000',
      
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      observe: 'body', responseType: 'json'
    });
    console.log('http request initiated');
    var firstname = (<HTMLInputElement>document.getElementById('firstname')).value;
    var lastname = (<HTMLInputElement>document.getElementById('lastname')).value;
    var username = (<HTMLIonInputElement>document.getElementById('Username')).value;
    var email = (<HTMLInputElement>document.getElementById('Email')).value;
    var phonenumber = (<HTMLInputElement>document.getElementById('Phone')).value;
    var password = (<HTMLIonInputElement>document.getElementById('Password')).value;
    var zip = (<HTMLInputElement>document.getElementById('Zip')).value;
    //var creds = [password, username];
    
    //alert(creds);
    //[key: string]: Product //login: string

    //production: http://ec2-3-86-230-37.compute-1.amazonaws.com/users/signup
    //development: http://localhost:3000/users/signup
    this.http.post<{[account_creation: string]: any}>('http://localhost:3000/users/signup', {firstName: firstname, lastName: lastname, username: username, email: email, phonenumber: phonenumber, password: password, zip: zip, responseType: 'application/json'}, {headers: headers}).subscribe((res) => {
    console.log(res.account_creation);  
    //var data = JSON.parse(res);
    //console.log(res.account_creation);
    //console.log(JSON.parse(JSON.stringify(res)))
    //let ress = JSON.parse(JSON.stringify(res))
    //console.log(data.Login)
    if (res.account_creation == 'success') {
      window.location.href = '/welcome/login';
      alert('Successfully created account');
    }

    if (res.account_creation == 'failure') {
      alert('Failed to create account');
    }
    // if (res.message == '401') {
    //   console.log(res.message)
    // }
    // if (res.message == '500') {
    //   console.log(res.message)
    // }
    });
  }


  }


