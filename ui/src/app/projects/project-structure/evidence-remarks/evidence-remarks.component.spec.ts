import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvidenceRemarksComponent } from './evidence-remarks.component';

describe('EvidenceRemarksComponent', () => {
  let component: EvidenceRemarksComponent;
  let fixture: ComponentFixture<EvidenceRemarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvidenceRemarksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvidenceRemarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
