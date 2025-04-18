import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReworkAcceptancePackageStep1Component } from './rework-acceptance-package-step1.component';

describe('ReworkAcceptancePackageStep1Component', () => {
  let component: ReworkAcceptancePackageStep1Component;
  let fixture: ComponentFixture<ReworkAcceptancePackageStep1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReworkAcceptancePackageStep1Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReworkAcceptancePackageStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
