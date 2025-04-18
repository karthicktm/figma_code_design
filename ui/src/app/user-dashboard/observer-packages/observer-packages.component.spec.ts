import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObserverPackagesComponent } from './observer-packages.component';

describe('ObserverPackagesComponent', () => {
  let component: ObserverPackagesComponent;
  let fixture: ComponentFixture<ObserverPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObserverPackagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObserverPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
