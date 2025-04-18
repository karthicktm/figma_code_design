import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkplanStructureComponent } from './workplan-structure.component';

describe('WorkplanStructureComponent', () => {
  let component: WorkplanStructureComponent;
  let fixture: ComponentFixture<WorkplanStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkplanStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkplanStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
