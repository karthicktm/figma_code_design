import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-sub-menu-item',
  templateUrl: './sub-menu-item.component.html',
  styleUrls: ['./sub-menu-item.component.less']
})
export class SubMenuItemComponent {
  //stores the title
  @Input() title: string;
  // stores the short description
  @Input() description: string;
  @Input() header?:string;
  // stores the class of the icon to show. For the second row we do not have the icons
  @Input() icon: string;
  // Stores the boolean to make the card disabled
  @Input() isActive: boolean;
  /** Is the card appearing clickable */
  @Input() readonly isClickable? = true;

  constructor() { }

}
