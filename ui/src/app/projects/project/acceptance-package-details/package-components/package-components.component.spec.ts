import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PackageComponentsComponent } from './package-components.component';

describe('PackageComponentsComponent', () => {
  let component: PackageComponentsComponent;
  let fixture: ComponentFixture<PackageComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PackageComponentsComponent]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
