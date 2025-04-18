import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectMultiInputComponent } from './select-multi-input.component';

describe('SelectMultiInputComponent', () => {
  let component: SelectMultiInputComponent;
  let fixture: ComponentFixture<SelectMultiInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectMultiInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectMultiInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
