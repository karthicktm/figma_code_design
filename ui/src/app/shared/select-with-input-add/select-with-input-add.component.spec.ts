import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWithInputAddComponent } from './select-with-input-add.component';

describe('SelectWithInputAddComponent', () => {
  let component: SelectWithInputAddComponent;
  let fixture: ComponentFixture<SelectWithInputAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectWithInputAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectWithInputAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
