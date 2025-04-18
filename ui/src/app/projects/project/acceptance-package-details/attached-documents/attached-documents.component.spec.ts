import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachedDocumentsComponent } from './attached-documents.component';

describe('AttachedDocumentsComponent', () => {
  let component: AttachedDocumentsComponent;
  let fixture: ComponentFixture<AttachedDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttachedDocumentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachedDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
