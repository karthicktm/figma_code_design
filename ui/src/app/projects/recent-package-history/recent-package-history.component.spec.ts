import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentPackageHistoryComponent } from './recent-package-history.component';

describe('RecentPackageHistoryComponent', () => {
  let component: RecentPackageHistoryComponent;
  let fixture: ComponentFixture<RecentPackageHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecentPackageHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentPackageHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
