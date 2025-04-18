import { TestBed } from '@angular/core/testing';

import { AppbarService } from './appbar.service';

describe('AppbarService', () => {
  let service: AppbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
