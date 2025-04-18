import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkElementInfoDialogComponent } from './network-element-info-dialog.component';

describe('SiteInfoComponent', () => {
  let component: NetworkElementInfoDialogComponent;
  let fixture: ComponentFixture<NetworkElementInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkElementInfoDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkElementInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
