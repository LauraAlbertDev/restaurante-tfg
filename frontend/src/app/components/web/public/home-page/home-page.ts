import { Component } from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {Carousel} from 'primeng/carousel';
import {PrimeTemplate} from 'primeng/api';

@Component({
  selector: 'app-home-page',
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatButton,
    RouterLink,
    Carousel,
    MatSidenavContent,
    PrimeTemplate
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
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
}
