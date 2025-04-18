import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Injectable, Type } from '@angular/core';
import { UrlTree } from '@angular/router';
import { RouterLinkComponent } from './router-link/router-link.component';
import { DatePickerComponent } from './date-picker/date-picker.component';

@Injectable({
  providedIn: 'root'
})
export class ComponentService {

  constructor(
    private applicationRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector,
  ) { }

  createRouterLink(
    linkProperties: {
      text: string;
      link: string | any[] | UrlTree;
      onClick?: () => void;
    },
    hostElement: Element,
  ): ComponentRef<RouterLinkComponent> {
    const componentRef = this.createComponent(RouterLinkComponent, hostElement);
    componentRef.setInput('text', linkProperties.text);
    componentRef.setInput('link', linkProperties.link);
    if (typeof linkProperties.onClick === 'function') componentRef.instance.onClick.subscribe(linkProperties.onClick);
    return componentRef;
  }

  createDatePicker(hostElement: Element): ComponentRef<DatePickerComponent> {
    return this.createComponent(DatePickerComponent, hostElement);
  }

  createComponent<C>(component: Type<C>, hostElement: Element): ComponentRef<C> {
    const environmentInjector = this.environmentInjector;
    const componentRef = createComponent(component, {
      environmentInjector,
      hostElement,
    });
    this.applicationRef.attachView(componentRef.hostView);
    return componentRef;
  }
}
