import { Directive, HostListener } from '@angular/core';
import { NavigationService } from './navigation.service';

@Directive({
  selector: '[appBackButton]'
})
export class BackButtonDirective {

  constructor(private navigationService: NavigationService) {}

  @HostListener('click')
  onClick(): void {
    this.navigationService.back()
  }
}
