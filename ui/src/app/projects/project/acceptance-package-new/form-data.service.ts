import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class FormDataService {
  public data = new ReplaySubject<string[]>(1);

  sendData(data: string[]): void {
    this.data.next(data);
  }
}
