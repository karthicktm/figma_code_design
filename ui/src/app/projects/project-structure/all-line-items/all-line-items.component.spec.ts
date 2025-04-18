import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLineItemsComponent } from './all-line-items.component';

describe('AllLineItemsComponent', () => {
  let component: AllLineItemsComponent;
  let fixture: ComponentFixture<AllLineItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllLineItemsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllLineItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
