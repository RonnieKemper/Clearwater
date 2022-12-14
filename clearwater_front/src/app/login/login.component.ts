import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    this.http.get('http://localhost:3000/users/profile')
  }
  ngOnInit() {}

}
