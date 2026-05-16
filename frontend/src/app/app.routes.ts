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
import { ProductsList } from './components/web/public/products/products-list/products-list';
import { ProductsEdit } from './components/web/authenticated/products-edit/products-edit';
import {AdminAllergens} from './components/web/admin/admin-allergens/admin-allergens';
import {ProductsDetail} from './components/web/public/products/products-detail/products-detail';
import {ReservationsPage} from './components/web/public/reservations-page/reservations-page';
import {ReservationsList} from './components/web/authenticated/reservations/reservations-list/reservations-list';
import {ReservationsEdit} from './components/web/authenticated/reservations/reservations-edit/reservations-edit';
import {AdminShifts} from './components/web/admin/admin-shifts/admin-shifts';
import {AdminSpecialDays} from './components/web/admin/admin-special-days/admin-special-days';
import {MyProfile} from './components/web/authenticated/my-profile/my-profile';
import {AdminDashboard} from './components/web/admin/admin-dashboard/admin-dashboard';
import {ReservationsDetail} from './components/web/authenticated/reservations/reservations-detail/reservations-detail';
import {TableMapComponent} from './components/web/tables/table-map/table-map';
import {OrderResume} from './components/web/authenticated/orders/order-resume/order-resume';


export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full' },
  { path: 'inicio', redirectTo: '' },
  { path: 'nosotros', component: AboutUsPage },
  { path: 'product/detail/:id', component: ProductsDetail },
  {path: 'menu', component: ProductsList},
  { path: 'reservas', component: ReservationsPage },
  { path: 'contacto', component: ContactPage },
  { path: 'login', component: LoginPage },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'comments-list', component: CommentsList },
      { path: 'comments-edit/:id', component: CommentsEdit },
      { path: 'categories', component: AdminCategories },
      { path: 'allergens', component: AdminAllergens },
      { path: 'users', component: AdminUsers },
      { path: 'shifts', component: AdminShifts },
      { path: 'special-days', component: AdminSpecialDays },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  },
  {
    path: 'leader',
    canActivate: [authGuard],
    data: { role: 'leader' },
    children: [
      { path: 'reservations-edit/:id', component: ReservationsEdit },
    ]
  },
  {
    path: 'auth',
    canActivate: [authGuard],
    children: [
      { path: 'product/new', component: ProductsEdit },
      { path: 'product-edit/:id', component: ProductsEdit},
      { path: 'reservations-list', component: ReservationsList },
      { path: 'reservations-detail/:id', component: ReservationsDetail },
      { path: 'my-profile', component: MyProfile },
      { path: 'orders-list', component: OrderResume },
      { path: 'mesas', component: TableMapComponent},
      { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    ]
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  }
];
