import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEvidencesComponent } from './site-evidences.component';

describe('SiteEvidencesComponent', () => {
  let component: SiteEvidencesComponent;
  let fixture: ComponentFixture<SiteEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEvidencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
