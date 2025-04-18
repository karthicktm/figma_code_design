import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineitemEvidenceDetailsComponent } from './lineitem-evidence-details.component';

describe('LineitemEvidenceDetailsComponent', () => {
  let component: LineitemEvidenceDetailsComponent;
  let fixture: ComponentFixture<LineitemEvidenceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineitemEvidenceDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LineitemEvidenceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
