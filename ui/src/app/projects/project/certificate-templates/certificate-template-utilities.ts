import { AbstractControl } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, take, switchMap, map, catchError, of, startWith } from 'rxjs';
import { CertificateTemplate } from '../../projects.interface';
import { ProjectsService } from '../../projects.service';

export const asyncCheckDuplicateName = (service: ProjectsService, projectId: string): (control: AbstractControl<string>) => Observable<{ [key: string]: any } | null> => {
  return (control: AbstractControl<string>): Observable<{ [key: string]: any } | null> => {
    return control.valueChanges.pipe(
      startWith(control.value),
      debounceTime(500),
      distinctUntilChanged(),
      // Async validator requires the observable to be finite, so we take(1) to complete the observable after the first value
      take(1),
      switchMap(value => service.getCertificateTemplateByName(projectId, value)),
      map((res: CertificateTemplate) => {
        if (res && res.templateName === control.value.trim()) {
          return ({ duplicate: true });
        } else {
          return null;
        }
      }),
      catchError(() => {
        return of({ validationFailed: true })
      }),
    );
  };
}
