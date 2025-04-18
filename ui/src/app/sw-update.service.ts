import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ReplaySubject } from 'rxjs';
import { filter, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {
  public readonly isAppStable: ReplaySubject<boolean> = new ReplaySubject(1);
  public readonly isUpdateAvailable: ReplaySubject<boolean> = new ReplaySubject(1);
  public readonly unrecoverable: ReplaySubject<string> = new ReplaySubject(1);

  constructor(
    private readonly appRef: ApplicationRef,
    private readonly swUpdate: SwUpdate,
  ) {
    swUpdate.versionUpdates
    .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
    .subscribe(evt => {
      this.isUpdateAvailable.next(true);
    });

    // Allow the app to stabilize first, before allowing to check for updates.
    const appIsStable = appRef.isStable.pipe(first(isStable => isStable === true));
    appIsStable.subscribe({
      next: (isStable) => {
        this.isAppStable.next(isStable);
      },
    });

    swUpdate.unrecoverable.subscribe({
      next: event => {
        this.unrecoverable.next(
          `An error occurred that we cannot recover from:\n
          ${event.reason}.
          \n\n`
        );
      }
    });

    swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          console.log(`Downloading new app version: ${evt.version.hash}`);
          break;
        case 'VERSION_READY':
          console.log(`Current app version: ${evt.currentVersion.hash}`);
          console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
          break;
      }
    });

  }

  /**
   * Trigger check for update.
   * This allows to manually start this check.
   */
  checkForUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate()
      .then((isUpdateAvailable) => {
        console.log(isUpdateAvailable ? 'A new version is available.' : 'Already on the latest version.')
        this.isUpdateAvailable.next(isUpdateAvailable);
        return isUpdateAvailable;
      })
      .catch((err) => console.error('Failed to check for updates:', err));
    }
    else {
      console.warn('No service worker loaded.')
    }
  }

}
