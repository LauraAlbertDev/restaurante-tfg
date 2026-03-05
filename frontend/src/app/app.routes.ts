import { Routes } from '@angular/router';
import {HomePage} from './components/web/public/home-page/home-page';
import {AboutUsPage} from './components/web/public/about-us-page/about-us-page';
import {ContactPage} from './components/web/public/contact-page/contact-page';
import {CommentsList} from './components/web/authenticated/comments/comments-list/comments-list';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    redirectTo: '/'
  },
  {
    path: 'nosotros',
    component: AboutUsPage
  },
  {
    path: 'contacto',
    component: ContactPage
  },
  {
    path: 'comments-list',
    component: CommentsList
  },
  {
    path: '**',
    redirectTo: 'inicio',
    pathMatch: 'full',
  }
];
