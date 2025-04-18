import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAcceptancePackageComponent } from './edit-acceptance-package.component';

describe('EditAcceptancePackageComponent', () => {
  let component: EditAcceptancePackageComponent;
  let fixture: ComponentFixture<EditAcceptancePackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditAcceptancePackageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAcceptancePackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
