import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptanceProjectListComponent } from './acceptance-project-list.component';

describe('AcceptanceProjectListComponent', () => {
  let component: AcceptanceProjectListComponent;
  let fixture: ComponentFixture<AcceptanceProjectListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptanceProjectListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptanceProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
