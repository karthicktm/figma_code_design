import { AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Select } from '@eds/vanilla';
import { OptionWithValue } from '../select/select.interface';

@Component({
  selector: 'app-select-multi-input',
  templateUrl: './select-multi-input.component.html',
  styleUrls: ['./select-multi-input.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectMultiInputComponent),
      multi: true
    }
  ]
})
export class SelectMultiInputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @ViewChild('selectContent') readonly selectElementRef: ElementRef<HTMLElement>;
  @ViewChild('input') readonly inputElementRef: ElementRef<HTMLElement>;

  @Input() options: any[] = [];
  @Input() selectedOptions: string[];
  @Input() disabled = false;
  // Hide output selections in EDS default options_container section and process the outputs customized in parent component
  @Input() hideOutput = false;
  @Input() selectId: string;
  @Input() placeholder: string;
  @Input() optionsWithValue?: OptionWithValue[];
  @Output() optionChanged = new EventEmitter();

  // public value: any;
  public select: Select;
  private scripts: Scripts[] = [];
  private selectDOM: HTMLElement;
  private selectListener: any;

  public propagateChange(option): void {
    this.optionChanged.emit(option);
  }

  constructor() { }

  writeValue(value: any): void {
    // Ignored - write initial or form propagated value
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  ngAfterViewInit(): void {
    if (this.selectId === undefined) {
      console.error('No selectId is set for a select-with-input-component. Please provide a selectId in the component template.');
      return;
    }

    this.selectDOM = this.selectElementRef.nativeElement.parentElement;
    if (this.selectDOM === undefined) {
      return;
    }

    this.select = new Select(this.selectDOM as HTMLElement);
    this.select.init();
    if (this.hideOutput) {
      const pillsContainer = this.selectDOM.querySelector('.options_container') as HTMLElement;
      pillsContainer.style.display = 'none';
    }
    this.scripts.push(this.select);

    this.selectDOM.addEventListener('selectOption',
      this.selectListener = (event): void => {
        this.propagateChange(event.detail.value);
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
   * Resets the input and selection state.
   */
   resetInput(): void {
     if (this.select) {
       this.select.value = [];
       this.select['_onResetForm']()
     }
   }
}
