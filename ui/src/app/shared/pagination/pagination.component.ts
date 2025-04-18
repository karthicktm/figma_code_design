import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Pagination } from '@eds/vanilla';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.less']
})
export class PaginationComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('pagination') readonly paginationElementRef: ElementRef<HTMLElement>;
  @Input() readonly totalRecords: number;
  @Input() readonly numPerPage: number;
  @Input() readonly currentPage: number;
  @Output() readonly changePage: EventEmitter<any> = new EventEmitter();
  private pagination: Pagination;
  private paginationDom: HTMLElement;
  private paginationChangeFn = (event): void => {
    this.changePage.emit(event.detail.state);
  }

  constructor() { }

  ngAfterViewInit(): void {
    const paginationDOM = this.paginationElementRef.nativeElement;
    if (paginationDOM) {
      const pagination = new Pagination(paginationDOM);
      pagination.state.numPerPage = this.numPerPage;
      pagination.state.currentPage = this.currentPage;
      pagination.state.numPages = Math.ceil(this.totalRecords / this.numPerPage);
      pagination.init(this.totalRecords);
      this.pagination = pagination;
      this.pagination.update(this.totalRecords);
      paginationDOM.addEventListener('paginationChangePage', this.paginationChangeFn, false);
      paginationDOM.addEventListener('paginationChangeSelect', this.paginationChangeFn, false);
      this.paginationDom = paginationDOM;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const pagination = this.pagination;
    if (pagination) {
      const totalRecords = changes.totalRecords? changes.totalRecords.currentValue : this.totalRecords;
      if (changes.numPerPage && changes.numPerPage.currentValue !== changes.numPerPage.previousValue) {
        pagination.state.numPerPage = changes.numPerPage.currentValue;
      }
      if (changes.currentPage && changes.currentPage.currentValue !== changes.currentPage.previousValue) {
        const currentPage = changes.currentPage.currentValue;
        pagination.state.currentPage = currentPage;
        pagination.state.numPages = Math.ceil(this.totalRecords / this.numPerPage);
        pagination.state.hasNextPage = (currentPage !==pagination.state.numPages);
        pagination.state.hasPreviousPage = (currentPage !== 1);
      }
      // re-init pagination to update the dom elements
      pagination.update(totalRecords);
    }
  }

  ngOnDestroy(): void {
    this.paginationDom.removeEventListener('paginationChangePage', this.paginationChangeFn, false);
    this.paginationDom.removeEventListener('paginationChangeSelect', this.paginationChangeFn, false);
    this.pagination.destroy();
  }
}
