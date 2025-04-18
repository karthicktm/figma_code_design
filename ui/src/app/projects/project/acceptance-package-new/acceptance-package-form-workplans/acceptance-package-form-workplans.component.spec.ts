import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormWorkplansComponent } from './acceptance-package-form-workplans.component';

describe('AcceptancePackageFormWorkplansComponent', () => {
  let component: AcceptancePackageFormWorkplansComponent;
  let fixture: ComponentFixture<AcceptancePackageFormWorkplansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptancePackageFormWorkplansComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormWorkplansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
