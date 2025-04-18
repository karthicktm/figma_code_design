import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserGroupInfoDialogComponent } from './user-group-info-dialog.component';

describe('UserGroupInfoDialogComponent', () => {
  let component: UserGroupInfoDialogComponent;
  let fixture: ComponentFixture<UserGroupInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserGroupInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserGroupInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
