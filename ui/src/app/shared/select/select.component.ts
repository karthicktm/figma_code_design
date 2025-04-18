import { AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Select } from '@eds/vanilla';
import { OptionWithValue } from './select.interface';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor, OnDestroy, AfterViewInit {
  @ViewChild('selectContent') readonly selectElementRef: ElementRef<HTMLElement>;

  @Input() options: any[] = [];
  @Input() disabled = false;
  @Input() selectId: string;
  @Input() selected: string;
  @Input() emptySelectionText: string;
  @Input() custom: boolean = false;
  @Input() optionsWithValue?: OptionWithValue[];
  @Output() optionChanged = new EventEmitter();

  public select: Select;
  private scripts: Scripts[] = [];
  private selectDOM: HTMLElement;
  optionSelected: boolean = false;


  public propagateChange(option): void {
    this.optionSelected = true;
    this.optionChanged.emit(option);
  }

  constructor() {
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
    this.disabled = isDisabled;
  }

  ngAfterViewInit(): void {
    if (this.selectId === undefined) {
      console.error('No selectId is set for a select-component. Please provide a selectId in the component template.');
      return;
    }
    this.selectDOM = this.selectElementRef.nativeElement.parentElement;
    if (this.selectDOM === undefined) {
      return;
    }
    this.select = new Select(this.selectDOM);
    this.select.init();
    this.scripts.push(this.select);
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  /**
   * Resets the selection state.
   */
  resetInput(): void {
    this.select['selectedOptions'] = [];
    this.select['dom'].current.innerText = this.selected ? this.selected : this.emptySelectionText || 'Select';
    // TODO: implement workaround or fix when EDS select supports
  }

}
