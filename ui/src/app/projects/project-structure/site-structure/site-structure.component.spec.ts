import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteStructureComponent } from './site-structure.component';

describe('SiteStructureComponent', () => {
  let component: SiteStructureComponent;
  let fixture: ComponentFixture<SiteStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
