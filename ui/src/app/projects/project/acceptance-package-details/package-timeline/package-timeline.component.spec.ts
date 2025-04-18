import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageTimelineComponent } from './package-timeline.component';

describe('PackageTimelineComponent', () => {
  let component: PackageTimelineComponent;
  let fixture: ComponentFixture<PackageTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
