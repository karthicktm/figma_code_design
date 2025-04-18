import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationGuard  {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<true | UrlTree> {
    const url: string = state.url;

    return this.checkLogin(url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<true | UrlTree> {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): Observable<true | UrlTree> {
    const url = `/${route.path}`;
    return this.checkLogin(url);
  }

  checkLogin(url: string): Observable<true|UrlTree> {
    return this.authService.isLoggedIn
    .pipe(
      take(1),
      timeout(5000),
      map((isLoggedIn) => {
        return isLoggedIn
          ? isLoggedIn
          : this.redirectUrl(url)
      }),
      catchError(() => {
        return of(this.redirectUrl(url))
      }),
    )
  }

  private redirectUrl(url: string): UrlTree {
    console.error('Authentication didn\'t work.');
    // Store the attempted URL for redirecting
    this.authService.redirectUrl = url;

    // Redirect to the login page
    return this.router.parseUrl('/');
  }
}
