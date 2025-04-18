import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiInterceptor } from '../projects/api.interceptor';


/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
];
