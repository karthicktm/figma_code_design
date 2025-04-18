import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectStructureComponent } from './project-structure.component';

describe('ProjectStructureComponent', () => {
  let component: ProjectStructureComponent;
  let fixture: ComponentFixture<ProjectStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectStructureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
