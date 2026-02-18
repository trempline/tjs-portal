import { Component, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  urlID:any;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,

  ){
    effect(() => {
     
     
    });
  }
  
  isMenuOpen: boolean = false;
  isDropdownOpen: boolean = false;
  isMobileDropdownOpen: boolean = false;
  
  // CSS for the header menu items based ont he urlID
  getMenuItemClass(urlID: any) {


  }
}
