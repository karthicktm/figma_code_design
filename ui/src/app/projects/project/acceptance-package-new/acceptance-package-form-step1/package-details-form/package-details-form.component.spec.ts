import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageDetailsFormComponent } from './package-details-form.component';

describe('PackageDetailsFormComponent', () => {
  let component: PackageDetailsFormComponent;
  let fixture: ComponentFixture<PackageDetailsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageDetailsFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
