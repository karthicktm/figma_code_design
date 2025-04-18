import { Injectable, signal } from '@angular/core';
import { CacheKey } from 'src/app/portal/services/session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  readonly store = signal(new Map<string, any>());

  public save<T>(key: CacheKey, data: T): void {
    return this.store.set(this.store().set(key, data));
  }

  public get<T>(key: CacheKey): T {
    return this.store().get(key);
  }

  public delete(key: CacheKey): void {
    const newMap = this.store();
    newMap.delete(key);
    return this.store.set(newMap);
  }

  public has(key: CacheKey): boolean {
    return !!this.get(key);
  }
}
