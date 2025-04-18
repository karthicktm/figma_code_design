import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupCreateDialogComponent } from './group-create-dialog.component';

describe('GroupCreateDialogComponent', () => {
  let component: GroupCreateDialogComponent;
  let fixture: ComponentFixture<GroupCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupCreateDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
