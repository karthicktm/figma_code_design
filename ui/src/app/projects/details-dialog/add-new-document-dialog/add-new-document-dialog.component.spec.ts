import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewDocumentDialogComponent } from './add-new-document-dialog.component';

describe('AddNewDocumentDialogComponent', () => {
  let component: AddNewDocumentDialogComponent;
  let fixture: ComponentFixture<AddNewDocumentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddNewDocumentDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNewDocumentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
