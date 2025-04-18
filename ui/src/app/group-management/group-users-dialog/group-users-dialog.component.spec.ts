import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupUsersDialogComponent } from './group-users-dialog.component';

describe('GroupUsersDialogComponent', () => {
  let component: GroupUsersDialogComponent;
  let fixture: ComponentFixture<GroupUsersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupUsersDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupUsersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
