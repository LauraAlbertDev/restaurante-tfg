import { Routes } from '@angular/router';
import {HomePage} from './components/web/public/home-page/home-page';
import {AboutUsPage} from './components/web/public/about-us-page/about-us-page';
import {ContactPage} from './components/web/public/contact-page/contact-page';
import {AdminUsers} from './components/web/admin/admin-users/admin-users';
import {LoginPage} from './components/web/public/login-page/login-page';
import {authGuard} from './components/guards/auth-guard';
import {CommentsList} from './components/web/admin/admin-comments/comments-list/comments-list';
import {CommentsEdit} from './components/web/admin/admin-comments/comments-edit/comments-edit';
import {AdminCategories} from './components/web/admin/admin-categories/admin-categories';


export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full' },
  { path: 'inicio', redirectTo: '' },
  { path: 'nosotros', component: AboutUsPage },
  { path: 'contacto', component: ContactPage },
  { path: 'login', component: LoginPage },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    children: [
      { path: 'comments-list', component: CommentsList },
      { path: 'comments/detail/:id', component: CommentsEdit },
      { path: 'categories', component: AdminCategories },
      { path: 'users', component: AdminUsers },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  }
];
