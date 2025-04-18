import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaximizeScreenComponent } from './maximize-screen.component';

describe('MaximizeScreenComponent', () => {
  let component: MaximizeScreenComponent;
  let fixture: ComponentFixture<MaximizeScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaximizeScreenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaximizeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
