import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateTableComponent } from './certificate-table.component';

describe('CertificateTableComponent', () => {
  let component: CertificateTableComponent;
  let fixture: ComponentFixture<CertificateTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificateTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
