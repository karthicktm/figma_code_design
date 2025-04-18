import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoFileStreamingPreviewComponent } from './video-file-streaming-preview.component';

describe('VideoFileStreamingPreviewComponent', () => {
  let component: VideoFileStreamingPreviewComponent;
  let fixture: ComponentFixture<VideoFileStreamingPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoFileStreamingPreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoFileStreamingPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
