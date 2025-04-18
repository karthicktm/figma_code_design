import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormMilestonesComponent } from './acceptance-package-form-milestones.component';

describe('AcceptancePackageFormMilestonesComponent', () => {
  let component: AcceptancePackageFormMilestonesComponent;
  let fixture: ComponentFixture<AcceptancePackageFormMilestonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptancePackageFormMilestonesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormMilestonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
