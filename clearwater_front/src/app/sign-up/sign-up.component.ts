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

  createProfile(){
    // const headers = new HttpHeaders({
    //   'Content-Type': 'application/json',
    //   'Authorization': 'my-auth-token',
    //   'Access-Control-Allow-Origin': 'http://localhost:4200',
    //   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    // });
    
    console.log('test');
    
    const headers = new HttpHeaders({
      'myHeader': 'proacademy',
      'Content-Type': 'application/json',
      'Authorization': 'my-auth-token',
      'Access-Control-Allow-Origin': 'http://localhost:4200',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    });
    var username = (<HTMLIonInputElement>document.getElementById('username')).value;
    var Firstname = (<HTMLInputElement>document.getElementById('Firstname')).value;
    var Lastname = (<HTMLInputElement>document.getElementById('Lastname')).value;
    var Email = (<HTMLInputElement>document.getElementById('Email')).value;
    //var zip = (<HTMLInputElement>document.getElementById('zip')).value;
    //var email = (<HTMLIonInputElement>document.getElementById('email')).value;
    var password = (<HTMLIonInputElement>document.getElementById('password')).value;
    var creds = [Firstname, Lastname, Email, password, username];
    //alert(creds);

    // this.http.get('localhost:3000/users/login').subscribe((res) => {console.log(res)})
    this.http.post<{name: string}>('http://localhost:3000/users/signup', creds, {headers: headers})  //products,
      .subscribe((res) => {
        console.log('help');
      });
    }

  // createProfile(){
  //   this.http.get('localhost:3000/users/signup')
  //     .subscribe(data => {
  //     // Handle the response data
  //     alert(data)
  // });
  // }
  }


