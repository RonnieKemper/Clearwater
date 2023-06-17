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
    return this.http.get('http://ec2-3-86-230-37.compute-1.amazonaws.com/users/profile') //prod: http://ec2-3-86-230-37.compute-1.amazonaws.com/users/profile, dev:https://localhost:3000/users/profile
  }
  login(){
    console.log('login function initiated');
    const headers = new HttpHeaders({
      'myHeader': 'clearwater',
      'Content-Type': 'application/json', //application/json //text/plain
      'Authorization': 'my-auth-token',
      'Access-Control-Allow-Origin': 'http://localhost:4200, http://localhost:3000',
      
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      observe: 'body', responseType: 'json'
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
    //[key: string]: Product //login: string //dev: http://localhost:3000/users/login prod: http://ec2-3-86-230-37.compute-1.amazonaws.com/users/login
    this.http.post<{[login: string]: any}>('http://ec2-3-86-230-37.compute-1.amazonaws.com/users/login', {username: username, password: password, responseType: 'application/json'}, {headers: headers}).subscribe((res) => {
    console.log(res);  
    //var data = JSON.parse(res);
    console.log(res.Login);
    //console.log(JSON.parse(JSON.stringify(res)))
    //let data = JSON.parse(JSON.stringify(res))
    //console.log(data.Login)
    if (res.Login == 'success') {
      window.location.href = '/profile';
      
    }
    });
  }
  ngOnInit() {}

}
