import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nullStringDate'
})
export class NullStringDatePipe extends DatePipe implements PipeTransform {

  /**
   * Transform with check and handler for string 'null'.
   * @param value 
   * @param format with app default
   * @param timezone with app default
   * @param locale 
   */
  transform(value: any, format: string = 'y-MM-dd', timezone?: string, locale?: string): string | null | /* Adding any to resolve error TS2416 */ any {
    if (value === 'null') {
      return 'Not available';
    }
    return super.transform(value, format, timezone, locale);
  }

}
