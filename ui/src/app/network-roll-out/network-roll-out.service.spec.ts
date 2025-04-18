import { TestBed } from '@angular/core/testing';

import { NetworkRollOutService } from './network-roll-out.service';

describe('NetworkRollOutService', () => {
  let service: NetworkRollOutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkRollOutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
