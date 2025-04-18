import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadPackageDialogComponent } from './download-package-dialog.component';

describe('DownloadPackageDialogComponent', () => {
  let component: DownloadPackageDialogComponent;
  let fixture: ComponentFixture<DownloadPackageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadPackageDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadPackageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
