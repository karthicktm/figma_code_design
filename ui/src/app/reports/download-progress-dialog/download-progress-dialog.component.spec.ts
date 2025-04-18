import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadProgressDialogComponent } from './download-progress-dialog.component';

describe('DownloadProgressDialogComponent', () => {
  let component: DownloadProgressDialogComponent;
  let fixture: ComponentFixture<DownloadProgressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadProgressDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadProgressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
