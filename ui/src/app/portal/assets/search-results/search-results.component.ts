import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output, QueryList,
  ViewChild,
  ViewChildren,
  Renderer2
} from '@angular/core';
import { Router } from '@angular/router';
import { TreeNode } from '../../tree-node.interface';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
})
export class SearchResultsComponent implements AfterViewChecked {
  searchResult: (TreeNode & { origin: TreeNode})[] = [];
  protected selectedResult = 0;
  bgColor = '';

  searchItem: SearchItem = { phrase: '', selected: true, command: 'search' };
  @ViewChild('searchResultListRef') searchResultListRef: ElementRef<HTMLElement>;
  @ViewChildren('searchResultElem') searchResultElements: QueryList<ElementRef>;
  @Output() searchSender = new EventEmitter<SearchItem>();
  @Input() menuItems: TreeNode[];
  @Input() sourceTreeViewPort?: HTMLElement;
  @Output() readonly selectedNode: EventEmitter<TreeNode> = new EventEmitter();

  @HostListener('mousedown', ['$event']) onClick(event: Event): void {
    event.preventDefault();
  }

  constructor(private router: Router, private renderer: Renderer2) { }

  ngAfterViewChecked(): void {
    this.searchResultElements.forEach((el, index) => {
      if (index === this.selectedResult) {
        this.renderer.addClass(el.nativeElement, 'selected');
      } else {
        this.renderer.removeClass(el.nativeElement, 'selected');
      }
    });
  }

  doSearch(): void {
    this.bgColor = window.getComputedStyle(document.getElementById('app')).backgroundColor;
    if (this.searchItem.command === 'search') {
      this.searchResult = [];
      this.searchHandler(this.menuItems);
    } else {
      this.searchMapping();
    }
  }

  private searchHandler(menuItems: TreeNode[]): void {
    const { phrase } = this.searchItem;
    this.selectedResult = 0;

    this.searchResult = this.filterData(menuItems, (item) => {
      return this.findStrInArray([item.name], phrase) || this.findStrInArray([item.id], phrase);
    });
  }

  private filterData(data: TreeNode[], predicate: (item: TreeNode) => boolean): (TreeNode & { origin: TreeNode})[] {
    const regReplace = new RegExp(this.searchItem.phrase, 'i');

    // if no data is sent in, return null, otherwise transform the data
    return data.reduce((list, entry) => {

      let clone = null;
      if (predicate(entry)) {
        // if the object matches the filter, clone it as it is
        clone = Object.assign({}, entry, {name: entry.name.replace(regReplace, `<b class="highlight">$&</b>`), origin: entry});
      }

      if (entry.subTree != null) {
        // if the object has children, filter the list of children
        const children = this.filterData(entry.subTree, predicate);
        if (children.length > 0) {
          // if any of the children matches, clone the parent object,
          // overwrite the children list with the filtered list
          if (clone) {
            clone.subTree = children;
          } else {
          // or clone parent object with filtered children
            clone = Object.assign({}, entry, {subTree: children});
          }
        }
      }

      // if there's a cloned object, push it to the output list
      if (clone) {
        list.push(clone);
      }

      return list;
    }, []);

  }

  private searchMapping(): void {
    const { command } = this.searchItem;
    if (this.sourceTreeViewPort) {
      const sourceContainer = this.sourceTreeViewPort.getBoundingClientRect();
      const searchResultElement = this.searchResultListRef.nativeElement;
      searchResultElement.style.height = `${sourceContainer.height}px`
    }
    const container = this.searchResultListRef
      .nativeElement
      .getBoundingClientRect();
    const searchResultElements = this.searchResultElements.toArray();

    if (command === 'enter') {
      if (searchResultElements[this.selectedResult]) {
        const selectedResultElement = searchResultElements[this.selectedResult].nativeElement as HTMLAnchorElement;
        const { pathname } = searchResultElements[this.selectedResult].nativeElement;
        if (pathname === undefined || (typeof pathname === 'string' && pathname.length === 0)) {
          selectedResultElement.dispatchEvent(new MouseEvent('click'));
          this.resetSearch();
        } else {
          const navigate = this.router
            .navigate([searchResultElements[this.selectedResult].nativeElement.pathname]);
          if (navigate) {
            navigate.then(() => {
              this.resetSearch();
            });
          }
        }
      }
    } else {
      let selectedId = this.selectedResult;
      if (command === 'up') {
        selectedId -= 1;
      } else if (command === 'down') {
        selectedId += 1;
      }

      if (selectedId >= searchResultElements.length) {
        selectedId = 0;
      } else if (selectedId < 0) {
        selectedId = searchResultElements.length - 1;
      }
      this.selectedResult = selectedId;

      const selectedItem = this.searchResultListRef.nativeElement.getElementsByClassName('result-item')[selectedId] as HTMLElement;
      if (
        selectedItem !== undefined && (
          container.bottom < selectedItem.getBoundingClientRect().bottom
          || selectedItem.getBoundingClientRect().top < container.top
        )
      ) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }

  resetSearch(): void {
    this.searchItem = { phrase: '', command: 'search', selected: false };
  }

  private findStrInArray(arr: string[] = [], str: string): boolean {
    if (!arr.length) {
      return false;
    }

    return arr.some((item) => item.toLowerCase().includes(str.toLowerCase()));
  }

}
