/* eslint-disable @typescript-eslint/no-unused-vars */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { DialogService } from './dialog.service';

describe('Service: Dialog', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DialogService]
    });
  });

  it('should ...', inject([DialogService], (service: DialogService) => {
    expect(service).toBeTruthy();
  }));
});
