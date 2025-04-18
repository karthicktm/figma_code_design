import { Directive, HostListener } from '@angular/core';
import { ThemeSwitchService } from '../services/theme-switch.service';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[themeChange], .theme-change'
})

export class ThemeSwitchDirective {
  themeSwitch = null;

  constructor (private themeSwitchService: ThemeSwitchService) {
    this.themeSwitch = themeSwitchService;
  }

  @HostListener('click', ['$event'])

  onClick(): void {
    this.themeSwitch.toggle();
  }
}
