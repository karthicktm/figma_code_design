import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipientTypesComponent } from './recipient-types.component';

describe('RecipientTypesComponent', () => {
  let component: RecipientTypesComponent;
  let fixture: ComponentFixture<RecipientTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipientTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipientTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
