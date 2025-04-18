import { Pipe, PipeTransform } from '@angular/core';

export const enum TruncatePos {
   Start = 1,
   Middle,
   End
}

@Pipe({ name: 'stringLengthTruncate' })
export class StringLengthTruncatePipe implements PipeTransform {

  private ellipsis: String = '...';

  public static get DefaultTruncatePos(): TruncatePos  {return  TruncatePos.End; }

  transform(value: string, length: number, pos?: TruncatePos): string | String {
    if (!length) {
      length = 10;
    }
    if (!pos) {
      pos = StringLengthTruncatePipe.DefaultTruncatePos;
    }
    // Handled the undefined or null
    if ((value || '').length > length) {
      if (pos) {
        switch (pos) {
          case TruncatePos.Start :
             return this.truncateAtStart(value, length);
          case TruncatePos.Middle:
             return this.truncateAtMiddle(value, length);
          case TruncatePos.End:
            return this.truncateAtEnd(value, length);
        }
      }
    }
    return value;
  }

  private truncateAtStart(value: String, length: number): String {
    return this.ellipsis + value.substr(0, length - this.ellipsis.length);
  }

  private truncateAtMiddle(value: String, length: number): String {
    if (value.length <= length) { return value; }
    const charsToShow = length - this.ellipsis.length;
    const startString = Math.ceil(charsToShow / 2);
    const endString = Math.floor(charsToShow / 2);
    return value.substr(0, startString) + '...' + value.substr(value.length - endString);
  }

  private truncateAtEnd(value: String, length: number): String {
    return value.substr(0, length - this.ellipsis.length) + this.ellipsis ;
  }
}


