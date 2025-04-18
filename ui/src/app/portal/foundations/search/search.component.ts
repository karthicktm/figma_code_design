import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { SearchResultsComponent } from '../../assets/search-results/search-results.component';
import { TreeNode } from '../../tree-node.interface';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
})
export class SearchComponent {
  @Input() readonly menuItems: TreeNode[];
  @Input() readonly sourceTreeViewPort: HTMLElement;
  @Output() readonly selectedNode: EventEmitter<TreeNode> = new EventEmitter();
  @ViewChild(SearchResultsComponent)
  private searchResults: SearchResultsComponent;
  private searchItem: SearchItem;

  searchHandler(event: SearchItem): void {
    this.searchItem = event;
    this.searchResults.searchItem = this.searchItem;
    this.searchResults.doSearch();
  }
}
