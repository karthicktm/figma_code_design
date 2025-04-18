import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvidenceHistoryComponent } from './evidence-history.component';

describe('EvidenceHistoryComponent', () => {
  let component: EvidenceHistoryComponent;
  let fixture: ComponentFixture<EvidenceHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EvidenceHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EvidenceHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
