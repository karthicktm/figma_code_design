import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReworkAcceptancePackageComponent } from './rework-acceptance-package.component';

describe('ReworkAcceptancePackageComponent', () => {
  let component: ReworkAcceptancePackageComponent;
  let fixture: ComponentFixture<ReworkAcceptancePackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReworkAcceptancePackageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReworkAcceptancePackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
