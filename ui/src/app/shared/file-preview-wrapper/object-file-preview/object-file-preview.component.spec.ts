import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectFilePreviewComponent } from './object-file-preview.component';

describe('ObjectFilePreviewComponent', () => {
  let component: ObjectFilePreviewComponent;
  let fixture: ComponentFixture<ObjectFilePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectFilePreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectFilePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
