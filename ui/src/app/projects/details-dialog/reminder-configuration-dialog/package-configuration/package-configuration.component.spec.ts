import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageConfigurationComponent } from './package-configuration.component';

describe('PackageConfigurationComponent', () => {
  let component: PackageConfigurationComponent;
  let fixture: ComponentFixture<PackageConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
