import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferReportsTableComponent } from './transfer-reports-table.component';

describe('TransferReportsTableComponent', () => {
  let component: TransferReportsTableComponent;
  let fixture: ComponentFixture<TransferReportsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferReportsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferReportsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
