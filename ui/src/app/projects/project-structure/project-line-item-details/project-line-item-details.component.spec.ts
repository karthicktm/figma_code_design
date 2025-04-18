import { ComponentFixture, TestBed } from '@angular/core/testing';


import { ProjectLineItemDetailsComponent } from './project-line-item-details.component';

describe('ProjectLineItemDetailsComponent', () => {
  let component: ProjectLineItemDetailsComponent;
  let fixture: ComponentFixture<ProjectLineItemDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectLineItemDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectLineItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
