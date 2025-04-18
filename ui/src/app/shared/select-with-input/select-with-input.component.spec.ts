import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWithInputComponent } from './select-with-input.component';

describe('SelectComponent', () => {
  let component: SelectWithInputComponent;
  let fixture: ComponentFixture<SelectWithInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectWithInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectWithInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
