import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReworkAcceptancePackageStep4Component } from './rework-acceptance-package-step4.component';

describe('ReworkAcceptancePackageStep4Component', () => {
  let component: ReworkAcceptancePackageStep4Component;
  let fixture: ComponentFixture<ReworkAcceptancePackageStep4Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReworkAcceptancePackageStep4Component]
    });
    fixture = TestBed.createComponent(ReworkAcceptancePackageStep4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
