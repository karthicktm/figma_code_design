import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Select } from '@eds/vanilla';

@Component({
  selector: 'app-select-with-input-add',
  templateUrl: './select-with-input-add.component.html',
  styleUrls: ['./select-with-input-add.component.less']
})
export class SelectWithInputAddComponent implements AfterViewInit, OnDestroy {
  @ViewChild('selectContent') readonly selectElementRef: ElementRef<HTMLElement>;

  @Input() options: {emailId: string, firstName: string, lastName: string}[];
  @Input() disabled = false;
  @Input() selectId: string;
  @Input() placeholder: string;
  @Output() addTriggered = new EventEmitter();

  public select: Select;
  private scripts: Scripts[] = [];
  private selectDOM: HTMLElement;
  selectListener: (event: any) => void;

  constructor() { }

  ngAfterViewInit(): void {
    if (this.selectId === undefined) {
      console.error('No selectId is set for a select-with-input-add-component. Please provide a selectId in the component template.');
      return;
    }
    this.selectDOM = this.selectElementRef.nativeElement.parentElement;
    if (this.selectDOM === undefined) {
      return;
    }
    this.select = new Select(this.selectDOM as HTMLElement);
    this.select.init();
    this.scripts.push(this.select);

    this.selectDOM.addEventListener('selectOption',
      this.selectListener = (event): void => {
        this.resetSelection();
      }
    );
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    this.selectDOM.removeEventListener('selectOption', this.selectListener);
  }

  /**
   * Emits the emailId of the entity to be added.
   * @param event calling this method
   * @param emailId to be emitted
   */
  add(event: MouseEvent, emailId): void {
    this.addTriggered.emit(emailId);
    this.selectDOM.parentElement.click();
  }

  private resetSelection(): void {
    const select = this.select;
    const inputElement: HTMLInputElement = select['dom'].input as HTMLInputElement;
    inputElement.value = '';
    select['selectedOptions'] = [];
    inputElement.dispatchEvent(new Event('keyup'));
    this.selectDOM.parentElement.click();
  }

}
