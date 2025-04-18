import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReworkAcceptancePackageStep3Component } from './rework-acceptance-package-step3.component';

describe('ReworkAcceptancePackageStep3Component', () => {
  let component: ReworkAcceptancePackageStep3Component;
  let fixture: ComponentFixture<ReworkAcceptancePackageStep3Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReworkAcceptancePackageStep3Component]
    });
    fixture = TestBed.createComponent(ReworkAcceptancePackageStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
