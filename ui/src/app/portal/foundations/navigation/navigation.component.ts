import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthorizationService } from 'src/app/auth/authorization.service';
import menuItems from '../../data/menu-items.json';

export interface UrlElements extends MenuInterface {
  isActiveUrlTree: UrlTree;
  // Is the user allowed to use this section
  isAllowed: Observable<boolean>;
  // Can the user see this menu item
  canView: Observable<boolean>;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '.appnav',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.less'],
  encapsulation: ViewEncapsulation.None,
})
export class NavigationComponent {
  @Output() navigationState = new EventEmitter<string>();
  items: UrlElements[] = [];

  constructor(
    public router: Router,
    private authorizationService: AuthorizationService,
  ) {
    this.items = this.menuFilter(menuItems);
  }

  toggleMenu(menuItem: string): void {
    this.navigationState.emit(menuItem);
  }

  private menuFilter(items: MenuInterface[]): UrlElements[] {
    const mItems = []; // JSON.parse(JSON.stringify(items))
    if (!items) {
      return [];
    }
    items.forEach((item) => {
      const mItem: UrlElements = JSON.parse(JSON.stringify(item));

      const { uri, children } = item;

      mItem.isActiveUrlTree = this.router.parseUrl(uri);
      if (children) {
        mItem.children = this.menuFilter(children);
      }
      mItem.canView = this.authorizationService.isUserAuthorized(mItem.canViewPermission);
      mItem.isAllowed = this.authorizationService.isUserAuthorized(mItem.requiredPermission);
      mItems.push(mItem);
    });

    return mItems;
  }

  toggleSubmenu(event: Event): void {
    (event.target as HTMLElement).classList.toggle('opened');
  }

  keyDownActions(event: Event): void {
    event.preventDefault();
    this.toggleSubmenu(event);
  }
  public isUserAuthorized(permission: string): Observable<boolean> {
    return this.authorizationService.isUserAuthorized(permission);
  }
}
