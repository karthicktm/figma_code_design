import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormStep2Component } from './acceptance-package-form-step2.component';

describe('AcceptancePackageFormStep2Component', () => {
  let component: AcceptancePackageFormStep2Component;
  let fixture: ComponentFixture<AcceptancePackageFormStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageFormStep2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
