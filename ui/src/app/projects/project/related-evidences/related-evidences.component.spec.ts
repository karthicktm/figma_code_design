import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedEvidencesComponent } from './related-evidences.component';

describe('RelatedEvidencesComponent', () => {
  let component: RelatedEvidencesComponent;
  let fixture: ComponentFixture<RelatedEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelatedEvidencesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
