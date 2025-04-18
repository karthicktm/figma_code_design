import { Component, input, OnInit, signal } from '@angular/core';
import { fromEvent, tap } from 'rxjs';

@Component({
  selector: 'app-statutory-notification',
  standalone: true,
  imports: [],
  templateUrl: './statutory-notification.component.html',
  styleUrl: './statutory-notification.component.less'
})
export class StatutoryNotificationComponent implements OnInit {
  storageKey = input<string>();
  statutoryText = signal('Please note, the documentation provided through the Ericsson Customer Acceptance tool is intended solely for use within the specified project scope. Redistribution or sharing with third parties or entities outside the authorized scope is strictly prohibited.');
  showStatutoryNotification = signal(true);

  constructor() {
    // Subscribe for storage events from other pages (tab, window).
    fromEvent(window, 'storage').pipe(
      tap(this.onStorage),
    ).subscribe()
  }

  ngOnInit(): void {
    const storageKey = this.storageKey();
    if (storageKey) {
      try {
        const statutoryConfig = this.getLocalConfig(storageKey);
        if (statutoryConfig) {
          if (typeof statutoryConfig.text === 'string' && statutoryConfig.text.length > 0) this.statutoryText.set(statutoryConfig.text);
          (statutoryConfig.hideOnStartup) ? this.hide() : this.show();
        }
      }
      catch {}
    }
  }

  hide(permanently?: string): void {
    this.showStatutoryNotification.set(false);
    const storageKey = this.storageKey();
    const localConfig = this.getLocalConfig(storageKey);
    localStorage.setItem(storageKey, JSON.stringify({...localConfig, ...{ hide: true, hideOnStartup: permanently || localConfig.hideOnStartup }}));
  }

  show(): void {
    this.showStatutoryNotification.set(true);
    const storageKey = this.storageKey();
    const localConfig = this.getLocalConfig(storageKey);
    localStorage.setItem(storageKey, JSON.stringify({...localConfig, ...{ hide: false }}));
  }

  toggleHideOnStartup(value: boolean): void {
    const storageKey = this.storageKey();
    const localConfig = this.getLocalConfig(storageKey);
    localStorage.setItem(storageKey, JSON.stringify({...localConfig, ...{ hideOnStartup: value ? 'permanently' : undefined }}));
  }

  private onStorage = (event: StorageEvent): void => {
    const storageKey = this.storageKey();
    if (storageKey !== undefined && event.key === storageKey) {
      const statutoryConfig = this.getParsedConfig(event.newValue);
      if (statutoryConfig) {
        if (typeof statutoryConfig.text === 'string' && statutoryConfig.text.length > 0) this.statutoryText.set(statutoryConfig.text);
        this.showStatutoryNotification.set(!statutoryConfig.hide);
      }
    }
  }

  private getLocalConfig(storageKey: string): any {
    const localConfigString = localStorage.getItem(storageKey);
    return this.getParsedConfig(localConfigString);
  }

  private getParsedConfig(configString: string): any {
    try {
      return JSON.parse(configString);
    } catch {
      return {};
    }
  }
}
