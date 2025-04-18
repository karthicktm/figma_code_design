import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SiteHierarchyComponent } from './site-hierarchy.component';

describe('SiteHierarchyComponent', () => {
  let component: SiteHierarchyComponent;
  let fixture: ComponentFixture<SiteHierarchyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SiteHierarchyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
