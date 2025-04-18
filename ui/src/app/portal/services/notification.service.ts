import { Injectable } from '@angular/core';
import { NotificationLog } from '@eds/vanilla';
import { SetNotificationProps, StateNotificationProps } from '@eds/vanilla/notification-log/NotificationLog';
import { Notification, NotificationProps } from '@eds/vanilla/notification/Notification';
import { fromEvent, tap } from 'rxjs';

const notificationStorageKey = 'appNotifications';
const filterNotificationsTypedArray = (notifications: unknown): StateNotificationProps[] => {
  if (Array.isArray(notifications)) {
    return notifications.filter(notification => {
      return ('isNew' in notification && 'title' in notification);
    })
  }
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notifications: unknown[] = this.getParsedConfig(localStorage.getItem(notificationStorageKey)) || [];

  constructor() {
    // Subscribe for storage events from other pages (tab, window).
    fromEvent(window, 'storage').pipe(
      tap(this.onStorage),
    ).subscribe()
  }

  /**
   * Shows a notification on screen.
   * The default timeout of showing the notification is 10000ms.
   * @param props to give the notification properties
   * @param applyFAQReference optional, indicates whether to add an action to open FAQ document
   */
  public showNotification(props: NotificationProps, applyFAQReference = false): void {
    const partialNotificationProps: Partial<NotificationProps> = {
      timeout: 10000,
    };
    const notificationProps: NotificationProps = {
      ...partialNotificationProps,
      ...props
    };
    if (applyFAQReference) {
      notificationProps.action = this.openFAQ;
    }

    const notification = new Notification(notificationProps);
    notification.init();
  }

  public showLogNotification(props: SetNotificationProps): void {
    const setProps: SetNotificationProps = props;
    setProps.timestamp = new Date();
    setProps.id = setProps.timestamp.valueOf();
    this.notifications.push(setProps);
    NotificationLog.setNotification(setProps);
    this.storeNotifications();
  }

  public initNotificationLog(): void {
    NotificationLog.init();
    const notifications = filterNotificationsTypedArray(this.notifications);
    NotificationLog.loadNotificationLog(notifications);
    window.addEventListener('NotificationLogCounterUpdated', () => {
      this.storeNotifications();
    });
  }

  private openFAQ = (): void => {
    const helpDom = document.querySelector('.sysbar .dropdown .menu .item a');
    if (helpDom) {
      helpDom.dispatchEvent(new MouseEvent('click'));
    }
  };

  private onStorage = (event: StorageEvent): void => {
    const storageKey = notificationStorageKey;
    if (storageKey !== undefined && event.key === storageKey) {
      this.notifications = this.getParsedConfig(localStorage.getItem(notificationStorageKey));
      const addedNotifications = filterNotificationsTypedArray(this.notifications);
      NotificationLog.loadNotificationLog(addedNotifications);
    }
  }

  private getParsedConfig(configString: string): any {
    try {
      return JSON.parse(configString);
    } catch {
      return [];
    }
  }

  private storeNotifications(): void {
    const currentNotifications = NotificationLog.getNotifications();
    localStorage.setItem(notificationStorageKey, JSON.stringify(currentNotifications.slice(currentNotifications.length - 5)));
  }
}
