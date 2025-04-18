import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageUsersComponent } from './package-users.component';

describe('PackageUsersComponent', () => {
  let component: PackageUsersComponent;
  let fixture: ComponentFixture<PackageUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageUsersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
