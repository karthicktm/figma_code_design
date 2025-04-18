import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteNavigationTreeComponent } from './site-navigation-tree.component';

describe('SiteNavigationTreeComponent', () => {
  let component: SiteNavigationTreeComponent;
  let fixture: ComponentFixture<SiteNavigationTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiteNavigationTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteNavigationTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
