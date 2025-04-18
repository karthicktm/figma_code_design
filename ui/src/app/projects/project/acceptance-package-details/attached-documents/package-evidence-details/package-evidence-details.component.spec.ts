import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageEvidenceDetailsComponent } from './package-evidence-details.component';

describe('PackageEvidenceDetailsComponent', () => {
  let component: PackageEvidenceDetailsComponent;
  let fixture: ComponentFixture<PackageEvidenceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageEvidenceDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageEvidenceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
