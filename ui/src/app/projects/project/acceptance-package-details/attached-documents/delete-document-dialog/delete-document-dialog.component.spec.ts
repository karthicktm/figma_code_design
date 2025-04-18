import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteDocumentDialogComponent } from './delete-document-dialog.component';

describe('DeleteDocumentDialogComponent', () => {
  let component: DeleteDocumentDialogComponent;
  let fixture: ComponentFixture<DeleteDocumentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteDocumentDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteDocumentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
