import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html'
})
export class MenuItemComponent {

  @Input() public isUserAuthorized = false;
  @Input() public isDisabled = false;
  @Input() public link: string;
  @Input() public name: string;
  @Output() public requestAccessClick = new EventEmitter();
  constructor() { }

  menuItemClicked(): void {
    document.dispatchEvent(new CustomEvent('hideNavigation'));
  }

  @HostBinding('class') get class(): string {
    return 'custom-position';
  }

}
