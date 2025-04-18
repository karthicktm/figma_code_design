import { ɵDEFAULT_LOCALE_ID as localeId } from '@angular/core';
import { NullStringDatePipe } from './null-string-date.pipe';

describe('NullStringDatePipe', () => {
  it('create an instance', () => {
    const pipe = new NullStringDatePipe(localeId);
    expect(pipe).toBeTruthy();
  });
});
