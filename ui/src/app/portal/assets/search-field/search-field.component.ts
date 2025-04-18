import { Component, EventEmitter, HostListener, OnInit, Output, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-search-field',
  templateUrl: './search-field.component.html',
  styles: []
})
export class SearchFieldComponent implements OnInit {
  searchCommand: SearchItem = { phrase: '', command: 'search', selected: false };
  searchField: HTMLInputElement = null;
  @Output() searchHandler = new EventEmitter<SearchItem>();
  @HostListener('keyup', ['$event']) onKey(event: any): void {
    this.searchCommand.phrase = event.target.value;

    switch (event.keyCode) {
      case 13:
        this.searchCommand = {
          phrase: '',
          command: 'enter',
          selected: false
        };
        ((): void => {
          setTimeout(() => {
            this.searchField.blur();
          }, 100);
        })();
        break;
      case 27:
        this.searchField.blur();
        break;
      case 37:
        this.searchCommand.command = 'left';
        break;
      case 38:
        this.searchCommand.command = 'up';
        break;
      case 39:
        this.searchCommand.command = 'right';
        break;
      case 40:
        this.searchCommand.command = 'down';
        break;
      default:
        this.searchCommand.command = 'search';
    }
    this.searchHandler.emit(this.searchCommand);
  }

  constructor(router: Router, private render: Renderer2) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.searchCommand = {
          phrase: '',
          command: 'search',
          selected: false
        };
        this.searchHandler.emit(this.searchCommand);
        this.searchField.blur();
      }
    });
  }

  ngOnInit(): void {
    this.searchField = this.render.selectRootElement('#searchField');
  }

  onBlur(): void {
    this.searchCommand.selected = false;
    this.searchCommand.command = 'blur';
    this.searchHandler.emit(this.searchCommand);
  }

  onFocus(): void {
    this.searchCommand.selected = true;
    this.searchCommand.command = 'focus';
    this.searchHandler.emit(this.searchCommand);
    this.searchField.select();
  }

}
