import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ComponentRef, EventEmitter, Injectable, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable()
export class DetailsContextualService {
  overlayRef: OverlayRef;
  sub: Subscription;
  // this stores the boolean sets to true on close of overlay
  closed: EventEmitter<any> = new EventEmitter();

  constructor(
    private overlay: Overlay
  ) { }

  getClosedEmitter(): EventEmitter<any> {
    return this.closed;
  }

  public open<T>(component: ComponentType<T>, viewContainerRef: ViewContainerRef, data?: any, customOverlayConfig?: OverlayConfig): ComponentRef<T> {
    const positionStrategy = this.overlay.position().global().top('0px').right('0px');

    const defaultOverlayConfig = new OverlayConfig({
      positionStrategy: positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
      width: '79%',
      height: '100%',
    });
    const overlayConfig = { ...defaultOverlayConfig, ...customOverlayConfig };

    if (this.overlayRef) {
      this.overlayRef.detach();
    } else {
      this.overlayRef = this.overlay.create(overlayConfig);
    }

    const componentRef = this.overlayRef.attach(new ComponentPortal(component, viewContainerRef));
    for (const key in data) {
      componentRef.instance[key] = data[key];
    }
    return componentRef;
  }

 public wizardOpen(component: any, viewContainerRef: ViewContainerRef, data?: any):void{
  const positionStrategy = this.overlay.position().global().top('0px').right('10px');
  const overlayConfig = new OverlayConfig({
    positionStrategy: positionStrategy,
    scrollStrategy: this.overlay.scrollStrategies.reposition(),
    hasBackdrop: true,
    width: '100%',
    height: '100%',
  });

  if (this.overlayRef) {
    this.overlayRef.detach();
  } else {
    this.overlayRef = this.overlay.create(overlayConfig);
  }

  const componentRef = this.overlayRef.attach(new ComponentPortal(component, viewContainerRef));
  for (const key in data) {
    componentRef.instance[key] = data[key];
  }
 }

  public close(updatedContext?: any): void {
    this.closed.emit(updatedContext);
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
