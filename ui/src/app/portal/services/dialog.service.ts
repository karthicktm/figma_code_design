import {
  AfterViewInit,
  ApplicationRef,
  Component, ComponentRef,
  createComponent,
  ElementRef,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Injector,
  OnDestroy,
  StaticProvider,
  Type,
  ViewChild
} from '@angular/core';
import { Dialog } from '@eds/vanilla';

/** Injection token for the Dialog's Data. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DIALOG_DATA = new InjectionToken<any>('DialogData');

/** Abstract component containing required properties to load an EDS dialog */
@Component({
  // The template will be provided by the extending component.
  // The extending component needs to provide a template which consists at least of the following tag.
  // ```<div #dialog class="dialog">```
  // For more details how to use the EDS dialog see http://eds.internal.ericsson.com/patterns/dialogs
  template: '',
})
export abstract class EDSDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog') readonly dialogElement: ElementRef<HTMLElement>;
  dialog: Dialog;
  ngAfterViewInit(): void {
    const dialog = new Dialog(this.dialogElement.nativeElement);
    dialog.init();
    dialog.show();
    this.dialog = dialog;
  }

  ngOnDestroy(): void {
    this.dialog.destroy();
  }
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(
    private injector: Injector,
    private environmentInjector: EnvironmentInjector,
    private applicationRef: ApplicationRef,
  ) { }

  /**
   * Creates an HTMLElement for the given component and attaches it to the DOM.
   * Instantiates a component and provides an injector for the given data object.
   * The injector can be used in the component via
   * ```
   * constructor(
   *   @Inject(DIALOG_DATA) public data: any,
   * ) {}
   * ```
   * Returns the ComponentRef of the created component.
   *
   * @param component representing the dialog component which eventually processes the data
   * @param data object containing data that is used by the dialog
   *
   * The type parameters are defined by the given method parameters
   */
  public createDialog<T extends EDSDialogComponent, D = any>(component: Type<T>, data: D | null = null): ComponentRef<T> {
    const userInjector = data && this.injector;
    const providers: StaticProvider[] = [
      { provide: DIALOG_DATA, useValue: data }
    ];
    const environmentInjector = this.environmentInjector;
    const dialog: HTMLElement = document.createElement('app-dialog');
    const elementInjector = Injector.create({ providers, parent: userInjector });
    const dialogComponentRef = createComponent(component, {
      environmentInjector,
      hostElement: dialog,
      elementInjector,
    });

    this.applicationRef.attachView(dialogComponentRef.hostView);

    const parent: HTMLElement = document.querySelector('body');
    parent.appendChild(dialog);

    // Get the element to be used to listen for dialog event
    const dialogDom = dialog.querySelector('.dialog') as HTMLElement;
    const dialogCloseListener = (): void => {
      dialogComponentRef.destroy();
      dialogDom.removeEventListener('DialogClose', dialogCloseListener);
    };
    dialogDom.addEventListener('DialogClose', dialogCloseListener);

    return dialogComponentRef;
  }
}
