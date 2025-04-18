import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproverPackagesComponent } from './approver-packages.component';

describe('ApproverPackagesComponent', () => {
  let component: ApproverPackagesComponent;
  let fixture: ComponentFixture<ApproverPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproverPackagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproverPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
