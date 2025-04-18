import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeStatusComponent } from './node-status.component';

describe('NodeStatusComponent', () => {
  let component: NodeStatusComponent;
  let fixture: ComponentFixture<NodeStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
