import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilestoneStructureComponent } from './milestone-structure.component';

describe('MilestoneStructureComponent', () => {
  let component: MilestoneStructureComponent;
  let fixture: ComponentFixture<MilestoneStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilestoneStructureComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MilestoneStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
