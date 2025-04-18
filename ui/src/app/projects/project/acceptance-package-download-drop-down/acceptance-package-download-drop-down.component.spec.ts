import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageDownloadDropDownComponent } from './acceptance-package-download-drop-down.component';

describe('AcceptancePackageDownloadDropDownComponent', () => {
  let component: AcceptancePackageDownloadDropDownComponent;
  let fixture: ComponentFixture<AcceptancePackageDownloadDropDownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageDownloadDropDownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptancePackageDownloadDropDownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
