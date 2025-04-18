import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthorizationService } from './authorization.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationGuard  {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private router: Router,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authorizationService.isUserAuthorized(route.data.permission).pipe(
      map((isAuthorized) => {
        // Fallback url configured in the route if user is not authorized to access the associated component
        // The redirect url can be configured in route's data field
        // ```data: {redirect: '${urlString}'}```
        // or
        // ```data: {redirect: {url: '${urlString}'}}```
        const getRedirectUrl = (redirect: string | { url: string }): string => {
          if (redirect) {
            if (typeof redirect === 'string') return `${state.url + redirect}`
            if (typeof redirect.url === 'string') return redirect.url;
          }
          return '/home';
        }
        return isAuthorized ? true : this.router.parseUrl(getRedirectUrl(route.data.redirect));
      })
    );
  }

}
