import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineItemInfoReworkDialogComponent } from './line-item-info-rework-dialog.component';

describe('LineItemInfoReworkDialogComponent', () => {
  let component: LineItemInfoReworkDialogComponent;
  let fixture: ComponentFixture<LineItemInfoReworkDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineItemInfoReworkDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineItemInfoReworkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
