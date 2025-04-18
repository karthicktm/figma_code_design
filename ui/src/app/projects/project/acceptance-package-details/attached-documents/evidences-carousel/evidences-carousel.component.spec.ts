import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvidencesCarouselComponent } from './evidences-carousel.component';

describe('EvidencesCarouselComponent', () => {
  let component: EvidencesCarouselComponent;
  let fixture: ComponentFixture<EvidencesCarouselComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EvidencesCarouselComponent]
    });
    fixture = TestBed.createComponent(EvidencesCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
