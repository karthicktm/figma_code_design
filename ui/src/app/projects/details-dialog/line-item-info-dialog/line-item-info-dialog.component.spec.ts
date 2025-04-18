import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineItemInfoDialogComponent } from './line-item-info-dialog.component';

describe('LineItemInfoDialogComponent', () => {
  let component: LineItemInfoDialogComponent;
  let fixture: ComponentFixture<LineItemInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineItemInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LineItemInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
