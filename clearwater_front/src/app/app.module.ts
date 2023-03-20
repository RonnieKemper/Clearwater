import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { CreateProfileComponent } from './profile/create-profile.component';
import { EmailConfirmationComponent } from './email-confirmation/email-confirmation.component';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { ReferComponent } from './refer/refer.component';



@NgModule({
  declarations: [AppComponent, WelcomeComponent, LoginComponent, SignUpComponent, CreateProfileComponent, EmailConfirmationComponent, ScheduleComponent, PromotionsComponent, ReferComponent, HomeComponent],
  imports: [BrowserModule, HttpClientModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
