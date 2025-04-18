import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerDescriptionDialogComponent } from './marker-description-dialog.component';

describe('MarkerDescriptionDialogComponent', () => {
  let component: MarkerDescriptionDialogComponent;
  let fixture: ComponentFixture<MarkerDescriptionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkerDescriptionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkerDescriptionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
