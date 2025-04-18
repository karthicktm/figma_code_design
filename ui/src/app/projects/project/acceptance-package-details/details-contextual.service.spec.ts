import { TestBed } from '@angular/core/testing';

import { DetailsContextualService } from './details-contextual.service';

describe('DetailsContextualService', () => {
  let service: DetailsContextualService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetailsContextualService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
