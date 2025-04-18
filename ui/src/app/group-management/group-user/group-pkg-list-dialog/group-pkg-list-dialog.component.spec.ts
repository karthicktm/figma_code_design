import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupPkgListDialogComponent } from './group-pkg-list-dialog.component';

describe('GroupPkgListDialogComponent', () => {
  let component: GroupPkgListDialogComponent;
  let fixture: ComponentFixture<GroupPkgListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupPkgListDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupPkgListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
