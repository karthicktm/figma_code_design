import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptancePackageNewComponent } from './acceptance-package-new.component';

describe('AcceptancePackageNewComponent', () => {
  let component: AcceptancePackageNewComponent;
  let fixture: ComponentFixture<AcceptancePackageNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptancePackageNewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptancePackageNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
