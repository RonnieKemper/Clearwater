import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {map} from 'rxjs/operators';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})

@Injectable({
  providedIn: 'root'
})
export class LoginComponent implements OnInit {

  constructor(private http: HttpClient) { }
  getData(){
    return this.http.get('http://localhost:3000/users/profile')
  }
  login(){
    console.log('login function initiated');
    const headers = new HttpHeaders({
      'myHeader': 'clearwater',
      'Content-Type': 'application/json',
      'Authorization': 'my-auth-token',
      'Access-Control-Allow-Origin': 'http://localhost:4200',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    });
    console.log('http request initiated');
    var username = (<HTMLIonInputElement>document.getElementById('username')).value;
    //var Firstname = (<HTMLInputElement>document.getElementById('Firstname')).value;
    //var Lastname = (<HTMLInputElement>document.getElementById('Lastname')).value;
    //var Email = (<HTMLInputElement>document.getElementById('Email')).value;
    //var zip = (<HTMLInputElement>document.getElementById('zip')).value;
    //var email = (<HTMLIonInputElement>document.getElementById('email')).value;
    var password = (<HTMLIonInputElement>document.getElementById('password')).value;
    var creds = [password, username];
    //alert(creds);

    this.http.post<{name: string}>('http://localhost:3000/users/login', creds, {headers: headers}).subscribe((res) => {
      console.log('help');
    });
  }
  ngOnInit() {}

}
