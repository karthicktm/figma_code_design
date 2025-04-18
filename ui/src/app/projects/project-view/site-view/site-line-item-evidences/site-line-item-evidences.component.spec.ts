import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteLineItemEvidencesComponent } from './site-line-item-evidences.component';

describe('SiteLineItemEvidencesComponent', () => {
  let component: SiteLineItemEvidencesComponent;
  let fixture: ComponentFixture<SiteLineItemEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteLineItemEvidencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteLineItemEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
