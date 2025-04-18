import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageInfoDialogComponent } from './package-info-dialog.component';

describe('PackageInfoDialogComponent', () => {
  let component: PackageInfoDialogComponent;
  let fixture: ComponentFixture<PackageInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageInfoDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackageInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
