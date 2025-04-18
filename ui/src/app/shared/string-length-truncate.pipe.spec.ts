import { StringLengthTruncatePipe } from './string-length-truncate.pipe';

describe('StringLengthTruncatePipe', () => {
  it('create an instance', () => {
    const pipe = new StringLengthTruncatePipe();
    expect(pipe).toBeTruthy();
  });
});
