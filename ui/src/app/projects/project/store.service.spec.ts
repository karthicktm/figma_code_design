import { TestBed } from '@angular/core/testing';

import { StoreService } from './store.service';
import { CacheKey } from 'src/app/portal/services/session-storage.service';

describe('StoreService', () => {
  let service: StoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store via save method', () => {
    const k = CacheKey.projectSelection;
    const storedObject = { value: 'Value' };
    service.save(k, storedObject);
    expect(service.get(k)?.['value']).toBe(storedObject.value);
  });
});
