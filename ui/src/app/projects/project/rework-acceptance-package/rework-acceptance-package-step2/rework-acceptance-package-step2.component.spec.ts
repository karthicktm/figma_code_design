import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReworkAcceptancePackageStep2Component } from './rework-acceptance-package-step2.component';

describe('ReworkAcceptancePackageStep2Component', () => {
  let component: ReworkAcceptancePackageStep2Component;
  let fixture: ComponentFixture<ReworkAcceptancePackageStep2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReworkAcceptancePackageStep2Component]
    });
    fixture = TestBed.createComponent(ReworkAcceptancePackageStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
