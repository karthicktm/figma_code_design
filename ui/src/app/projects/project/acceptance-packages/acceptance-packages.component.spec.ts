import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackagesComponent } from './acceptance-packages.component';

describe('AcceptancePackagesComponent', () => {
  let component: AcceptancePackagesComponent;
  let fixture: ComponentFixture<AcceptancePackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptancePackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
