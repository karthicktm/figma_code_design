import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectCertReqDialogComponent } from './reject-dialog.component';

describe('RejectCertReqDialogComponent', () => {
  let component: RejectCertReqDialogComponent;
  let fixture: ComponentFixture<RejectCertReqDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RejectCertReqDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RejectCertReqDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
