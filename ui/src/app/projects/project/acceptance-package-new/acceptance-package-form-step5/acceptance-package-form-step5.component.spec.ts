import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormStep5Component } from './acceptance-package-form-step5.component';

describe('AcceptancePackageFormStep5Component', () => {
  let component: AcceptancePackageFormStep5Component;
  let fixture: ComponentFixture<AcceptancePackageFormStep5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageFormStep5Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormStep5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
