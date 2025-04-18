import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a byte value to a human-readable format.
 *
 * Example uses:
 * -------------
 * {{ value | formatBytes }} - use short units.
 * {{ value | formatBytes: "long"}} - use long name units
 */
@Pipe({
  standalone: true,
  name: 'formatBytes',
  pure: false
})
export class FormatBytesPipe implements PipeTransform {
  private _units: string[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  private _unitsLong: string[] = [ 'Bytes', 'Kilobytes', 'Megabytes', 'Gigabytes', 'Terabytes', 'Petabytes', 'Exabytes', 'Zettabytes', 'Yottabytes'];

  constructor() { }

  transform(bytes: number, format: 'short' | 'long' = 'short'): any {
    if (!Number(bytes)) { return ''; }

    let units: string[];

    if (format === 'long') {
      units = this._unitsLong;
    } else {
      units = this._units;
    }

    bytes = Math.max(bytes, 0);
    let pow = Math.floor((bytes ? Math.log(bytes) : 0) / Math.log(1024));
    pow = Math.min(pow, this._units.length - 1);
    const value = bytes / (Math.pow(1000, pow));
    return Math.round(value * 100) / 100  + ' ' + units[pow];

  }
}
