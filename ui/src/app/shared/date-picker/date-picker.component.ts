import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, model, OnDestroy, viewChild } from '@angular/core';
import { Datepicker } from '@eds/vanilla';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [],
  templateUrl: './date-picker.component.html',
  styleUrls: [
    './date-picker.component.less',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent implements OnDestroy {
  readonly datePicker = viewChild.required<ElementRef<HTMLElement>>('datePicker');
  readonly value = model<string>();
  readonly formattedValue = computed<string>(() => {
    const value = this.value();
    if (value === undefined) return value;
    return (value && this.isValidDate(value)) ? value : this.correctedDate(this.datePickerInstance) || '';
  })
  private datePickerInstance: Datepicker;

  constructor() {
    effect(() => {
      const datePickerDOM = this.datePicker()?.nativeElement;
      const datePicker = new Datepicker(datePickerDOM);
      datePicker.init();
      this.datePickerInstance = datePicker;
    });

    effect(
      () => {
        const value = this.formattedValue();
        if (value !== undefined) {
          this.datePicker()?.nativeElement.dispatchEvent(new CustomEvent('change', { detail: value }));
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnDestroy(): void {
    this.datePickerInstance?.destroy();
  }

  onInputChange(event: Event): void {
    event.stopPropagation();
    if (event.target instanceof HTMLInputElement) this.value.set(event.target.value);
  }

  private correctedDate(datePicker: Datepicker): string {
    return datePicker?.['selectedDate']
      ? `${datePicker?.['selectedDate'].year}-${datePicker?.['selectedDate'].month}-${datePicker?.['selectedDate'].day}`
      : '';
  };

  /**
   * Check if date is valid.
   * @param dateString to validate
   */
  private isValidDate(dateString: string): boolean {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    // Invalid format
    if (!dateString.match(regEx)) {
      return false;
    }
    const d = new Date(dateString);
    // Invalid date (or this could be epoch), https://stackoverflow.com/a/1353711/4634380
    if (isNaN(d.getTime())) {
      return false;
    }
    return d.toISOString().slice(0, 10) === dateString;
  }
}
