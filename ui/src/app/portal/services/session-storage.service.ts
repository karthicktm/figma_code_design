import { Injectable } from '@angular/core';

export enum CacheKey {
  userSession = 'user_session',
  usersProjects = 'users_projects',
  notificationSettings = 'notification_settings',
  currentProject = 'current_project',
  breadcrumb = 'breadcrumb',
  projectSelection = 'project-dashboard--project-selection',
  packageFilterSelection = 'project-dashboard--package-filter-selection',
  packageSelection = 'project-dashboard--package-selection',
}

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor() { }

  public save<T>(key: CacheKey, data: T): void {
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  public get<T>(key: CacheKey): T {
    return JSON.parse(sessionStorage.getItem(key));
  }

  public remove(key: CacheKey): void {
    sessionStorage.removeItem(key);
  }

  public has(key: CacheKey): boolean {
    return !!this.get(key);
  }
}
