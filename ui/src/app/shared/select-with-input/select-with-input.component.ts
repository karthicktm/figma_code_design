import { AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Select } from '@eds/vanilla';
import { OptionWithValue } from '../select/select.interface';

@Component({
  selector: 'app-select-with-input',
  templateUrl: './select-with-input.component.html',
  styleUrls: ['./select-with-input.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectWithInputComponent),
      multi: true
    }
  ]
})
export class SelectWithInputComponent implements ControlValueAccessor, OnDestroy, AfterViewInit {

  @Input() options: any[] = [];
  @Input() selectedOption: string;
  @Input() disabled = false;
  @Input() selectId: string;
  @Input() placeholder: string;
  @Input() optionsWithValue?: OptionWithValue[];
  @Output() optionChanged = new EventEmitter();
  public value: any;

  public select: Select;
  private scripts: Scripts[] = [];
  private selectDOM: HTMLElement;
  private selectListener: any;

  constructor(
    el: ElementRef,
  ) {
    this.selectDOM = el.nativeElement;
  }

  public propagateChange(option): void {
    this.optionChanged.emit(option);
  }

  writeValue(value: any): void {
    if (this.select) this.select.value = value;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  // Initialize the select script
  initializeSelect(): void {
    const selectIsInitialized = this.scripts.find(script => script instanceof Select);
    if (!selectIsInitialized) {
      if (this.selectDOM === undefined) {
        return;
      }

      this.selectDOM.addEventListener('selectOption',
        this.selectListener = (event): void => {
          if (event.detail?.value !== undefined && event.detail.value.length > 0)
          this.propagateChange(event.detail.value[0]);
        }
      );

      this.select = new Select(this.selectDOM);
      this.select.init();
      this.scripts.push(this.select);

    }
  }

  ngAfterViewInit(): void {
    if (this.selectId === undefined) {
      console.error('No selectId is set for a select-with-input-component. Please provide a selectId in the component template.');
      return;
    }
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
    const inputElement: HTMLInputElement = this.select['dom'].input as HTMLInputElement;
    inputElement.value = '';
    this.select['selectedOptions'] = [];
    this.value = undefined;
    inputElement.dispatchEvent(new Event('keyup'));
    this.selectDOM.parentElement.click();
  }

}
