import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, of, ReplaySubject } from 'rxjs';
import { tap, delay } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  isLoggedIn = new ReplaySubject<boolean>(1);

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  constructor(private router: Router) { }

  login(): Observable<boolean> {
    return of(true).pipe(
      delay(1000),
      tap(() => this.isLoggedIn.next(true))
    );
  }

  logout(): void {
    this.isLoggedIn.next(false);
    location.href = `${document.baseURI}logout`;
  }
}
