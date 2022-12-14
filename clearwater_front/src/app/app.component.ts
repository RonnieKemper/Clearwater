import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    
  }

  // getDataFromAPI(){
  //   this.service.getData().subscribe((response) => {
  //     console.log('response from api is ', response);

  //   }, (error) => {
  //     console.log('error is ', error);
  //   })
  // }
}
