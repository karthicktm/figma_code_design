import { ComponentRef, Injectable, Type, ViewContainerRef } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Data as BreadcrumbData } from '@eds/vanilla/breadcrumb/Breadcrumb';
import { ActionComponent } from './action.component';

/** Provides access to the instantiated breadcrumb */
@Injectable({
  providedIn: 'root'
})
export class AppbarService {
  private actionContainer: ViewContainerRef;
  // Property to subscribe and emit breadcrumb changes
  public breadCrumbData: ReplaySubject<BreadcrumbData[]> = new ReplaySubject(1);
  public isLoading: ReplaySubject<boolean> = new ReplaySubject(1);
  public isError: ReplaySubject<boolean> = new ReplaySubject(1);
  public errorReason: ReplaySubject<number> = new ReplaySubject(1);
  constructor() { }

  set ActionContainer(value: ViewContainerRef) {
    this.actionContainer = value;
  }

  loadAction(componentType: Type<ActionComponent>): ComponentRef<ActionComponent> {
    if (!this.actionContainer) {
      console.error();
    }
    const componentRef = this.actionContainer.createComponent<ActionComponent>(componentType);
    return componentRef;
  }

  clearAction(): void {
    this.actionContainer?.clear();
  }
}
