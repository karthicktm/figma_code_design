import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormStep3Component } from './acceptance-package-form-step3.component';

describe('AcceptancePackageFormStep3Component', () => {
  let component: AcceptancePackageFormStep3Component;
  let fixture: ComponentFixture<AcceptancePackageFormStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageFormStep3Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
