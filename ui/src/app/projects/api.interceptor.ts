import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { CacheKey, SessionStorageService } from '../portal/services/session-storage.service';
import { UserSession } from './projects.interface';
import { ProjectsService } from './projects.service';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(
    private sessionStorageService: SessionStorageService,
    private projectsService: ProjectsService,
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (
      request.url !== '/userSession'
      && !request.url.startsWith('data:')
    ) {
      if (request.url !== '/logout') {
        // Special handling for video urls from storage server
        if (request.url.startsWith('https://') && request.url.indexOf('/acceptancedocuments') != -1) {
          return next.handle(this.addXmlHttpRequestHeaderToRequest(request));
        }

        request = request.url.includes('/eca-nro')
          ? this.changeNetworkRollOutUrl(request)
          : this.changeCorporateUrl(request);

        const userSession = this.sessionStorageService.get<UserSession>(CacheKey.userSession);
        const bearer = userSession.accessToken;
        const expiresAt = userSession.expiresAt;
        const now = Date.now();
        if (!bearer || !expiresAt || expiresAt <= now) {
          return this.projectsService.getUserSession().pipe(
            switchMap((userSession: UserSession) => {
              this.sessionStorageService.save<UserSession>(CacheKey.userSession, userSession);
              return next.handle(this.addHeadersToRequest(request, userSession.accessToken))
            }),
          );
        }
        return next.handle(this.addHeadersToRequest(request, bearer))
      } else {
        return next.handle(this.addXmlHttpRequestHeaderToRequest(request))
      }
    } else {
      return next.handle(this.addXmlHttpRequestHeaderToRequest(request))
    }
  }

  /**
   * adds dynamic bearer and
   * in order to receive a 401 for an expired session, adding header X-Requested-With: XMLHttpRequest as per cloudflare documentation
   * this methods bearer and expired session header
   */
  private addHeadersToRequest(
    request: HttpRequest<unknown>,
    bearer: string,
  ): HttpRequest<unknown> {
    const sessionHeaderRequest = request.clone({
      setHeaders: {
        Authorization: bearer,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    return sessionHeaderRequest;
  }

  /**
   * in order to receive a 401 for an expired session, adding header X-Requested-With: XMLHttpRequest as per cloudflare documentation
   * this methods only one specific header
   */
  private addXmlHttpRequestHeaderToRequest(
    request: HttpRequest<unknown>
  ): HttpRequest<unknown> {
    const sessionHeaderRequest = request.clone({
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    return sessionHeaderRequest;
  }


  private changeNetworkRollOutUrl(
    request: HttpRequest<unknown>,
  ): HttpRequest<unknown> {
    const apiVersionURL = 'api/v1'
    return request.clone({
      url: request.url.replace('/eca-nro', `/eca-nro/${apiVersionURL}`),
    });
  }

  private changeCorporateUrl(
    request: HttpRequest<unknown>,
  ): HttpRequest<unknown> {
    const userSession = this.sessionStorageService.get<UserSession>(CacheKey.userSession);
    const customerUrl = userSession.customerApiUrl;
    const ericssonUrl = 'api/v1';
    return request.clone({
      url: userSession?.userType === undefined || userSession.userType.toLowerCase() === 'ericsson' || request.url.includes('/users/' + userSession.signum) ? `${ericssonUrl}${request.url}` : `${customerUrl || ericssonUrl}${request.url}`,
    });
  }
}
