import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormMilestoneLineItemsComponent } from './acceptance-package-form-milestone-line-items.component';

describe('AcceptancePackageFormMilestoneLineItemsComponent', () => {
  let component: AcceptancePackageFormMilestoneLineItemsComponent;
  let fixture: ComponentFixture<AcceptancePackageFormMilestoneLineItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptancePackageFormMilestoneLineItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormMilestoneLineItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
