import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageFormSitesComponent } from './acceptance-package-form-sites.component';

describe('AcceptancePackageFormSitesComponent', () => {
  let component: AcceptancePackageFormSitesComponent;
  let fixture: ComponentFixture<AcceptancePackageFormSitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptancePackageFormSitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageFormSitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
