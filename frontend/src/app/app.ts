import {Component, inject, signal} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {Navbar} from './components/structure/navbar/navbar';
import {Footer} from './components/structure/footer/footer';
import {filter} from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('restaurante');

  isHome = false;
  isMenu = false;
  private router:Router = inject(Router)

  constructor(){

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e:any)=>{

        const url = e.urlAfterRedirects;

        this.isHome = url === '/';
        this.isMenu = url.startsWith('/menu');
      });
  }
}
