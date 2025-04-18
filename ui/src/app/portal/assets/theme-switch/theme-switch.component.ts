import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ThemeSwitchService } from '../../services/theme-switch.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'eds-theme-switch',
  templateUrl: './theme-switch.component.html',
  styleUrls: ['./theme-switch.component.less']
})
export class ThemeSwitchComponent {
  @Input() options: SwitchInputs;
  @Output() selectedTheme = new EventEmitter<string>();
  themeSwitch = null;

  constructor(private themeSwitchService: ThemeSwitchService) {
    this.themeSwitch = themeSwitchService;
  }

  onThemeChange(): void {
    this.selectedTheme.emit(this.themeSwitch.theme);
  }
}
