import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineItemDataComponent } from './line-item-data.component';

describe('LineItemDataComponent', () => {
  let component: LineItemDataComponent;
  let fixture: ComponentFixture<LineItemDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineItemDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineItemDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
