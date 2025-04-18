import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvidencesCarouselComponent } from './evidences-carousel.component';

describe('EvidencesCarouselComponent', () => {
  let component: EvidencesCarouselComponent;
  let fixture: ComponentFixture<EvidencesCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvidencesCarouselComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EvidencesCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
