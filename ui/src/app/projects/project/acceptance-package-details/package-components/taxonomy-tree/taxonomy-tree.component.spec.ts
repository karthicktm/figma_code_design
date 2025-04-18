import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxonomyTreeComponent } from './taxonomy-tree.component';

describe('TaxonomyTreeComponent', () => {
  let component: TaxonomyTreeComponent;
  let fixture: ComponentFixture<TaxonomyTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaxonomyTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxonomyTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
