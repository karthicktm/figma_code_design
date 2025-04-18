import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableServerSidePaginationComponent } from './table-server-side-pagination.component';

describe('TableServerSidePaginationComponent', () => {
  let component: TableServerSidePaginationComponent;
  let fixture: ComponentFixture<TableServerSidePaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableServerSidePaginationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableServerSidePaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
