import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageDetailsComponent } from './acceptance-package-details.component';

describe('AcceptancePackageDetailsComponent', () => {
  let component: AcceptancePackageDetailsComponent;
  let fixture: ComponentFixture<AcceptancePackageDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptancePackageDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
