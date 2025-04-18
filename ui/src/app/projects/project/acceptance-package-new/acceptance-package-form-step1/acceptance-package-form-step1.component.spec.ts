import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormStep1Component } from './acceptance-package-form-step1.component';

describe('AcceptancePackageFormStep1Component', () => {
  let component: AcceptancePackageFormStep1Component;
  let fixture: ComponentFixture<AcceptancePackageFormStep1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageFormStep1Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
