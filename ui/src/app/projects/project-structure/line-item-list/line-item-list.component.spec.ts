import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineItemListComponent } from './line-item-list.component';

describe('LineItemListComponent', () => {
  let component: LineItemListComponent;
  let fixture: ComponentFixture<LineItemListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineItemListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
