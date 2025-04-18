import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestAccessDialogComponent } from './request-access-dialog.component';

describe('RequestAccessDialogComponent', () => {
  let component: RequestAccessDialogComponent;
  let fixture: ComponentFixture<RequestAccessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestAccessDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestAccessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
