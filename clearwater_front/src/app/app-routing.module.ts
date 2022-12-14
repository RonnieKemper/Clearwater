import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { CreateProfileComponent } from './profile/create-profile.component';
import { EmailConfirmationComponent } from './email-confirmation/email-confirmation.component';


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
    path: 'welcome/sign-up/create-profile',
    component: CreateProfileComponent,
  },
  {
    path: 'welcome/sign-up/create-profile/email-confirmation',
    component: EmailConfirmationComponent,
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
