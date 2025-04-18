import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbandonAcceptancePackageDialogComponent } from './abandon-acceptance-package-dialog.component';

describe('DeleteAcceptancePackageComponent', () => {
  let component: AbandonAcceptancePackageDialogComponent;
  let fixture: ComponentFixture<AbandonAcceptancePackageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AbandonAcceptancePackageDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbandonAcceptancePackageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
