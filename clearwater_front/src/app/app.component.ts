import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Check if the user has an authentication token stored in the browser
    const token = localStorage.getItem('jwt');
    if (token) {
      // The user has an authentication token, so initiate the HTTPS connection
      const apiEndpoint = 'https://localhost:3000/api';
      this.http.get(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).subscribe((response) => {
        console.log(response);
      });
    // Authenticate the user
    const username = '<insert username here>';
    const password = '<insert password here>';
    const authenticationToken = btoa(`${username}:${password}`); // Base64 encode the username and password

    // Initiate the HTTPS connection
    this.http.get(apiEndpoint, {
      headers: {
        'Authorization': `Basic ${authenticationToken}`
      }
    }).subscribe((response) => {
      console.log(response);
    });
  }
  

  // getDataFromAPI(){
  //   this.service.getData().subscribe((response) => {
  //     console.log('response from api is ', response);

  //   }, (error) => {
  //     console.log('error is ', error);
  //   })
  // }
}
}
