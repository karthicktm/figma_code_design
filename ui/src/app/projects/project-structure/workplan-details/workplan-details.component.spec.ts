import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkplanDetailsComponent } from './workplan-details.component';

describe('WorkplanDetailsComponent', () => {
  let component: WorkplanDetailsComponent;
  let fixture: ComponentFixture<WorkplanDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkplanDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkplanDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
