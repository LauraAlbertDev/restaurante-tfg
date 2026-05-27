import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-home-page',
  imports: [
    MatSidenavContent,
    MatSidenavContainer,
    MatSidenav,
    RouterLink,
    MatButton
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements AfterViewInit {
  @ViewChild('carrusel', { static: false }) carruselElement!: ElementRef;
  slides = [
    { image: 'assets/images/hero-comida.jpg' },
    { image: 'assets/images/hero-paella.jpg' },
    { image: 'assets/images/hero-entrecot.jpg' }
  ];

  pages = [
    { name: 'Menú', link: '/menu' },
    { name: 'Nosotros', link: '/nosotros' },
    { name: 'Contacto', link: '/contacto' },
  ]
  ngAfterViewInit() {
    if (this.carruselElement) {
      new bootstrap.Carousel(this.carruselElement.nativeElement);
    }
  }
}
