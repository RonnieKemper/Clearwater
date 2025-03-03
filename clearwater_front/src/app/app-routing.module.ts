import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { HomeComponent } from './home/home.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { ReferComponent } from './refer/refer.component';
import { CreateProfileComponent } from './profile/create-profile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';


const routes: Routes = [

  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
  },
  {
    path: 'welcome/login',
    component: LoginComponent,
  },
  {
    path: 'welcome/sign-up',
    component: SignUpComponent,
  },
  {
    path: 'profile',
    component: CreateProfileComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'schedule',
    component: ScheduleComponent,
  },
  {
    path: 'promotions',
    component: PromotionsComponent,
  },
  {
    path: 'refer',
    component: ReferComponent,
  },
  { path: 'verify-email',
    component: VerifyEmailComponent },
  { path: '**', redirectTo: '/' },
  // {
  //   path: 'welcome/sign-up/create-profile/email-confirmation',
  //   component: EmailConfirmationComponent,
  // },



];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
