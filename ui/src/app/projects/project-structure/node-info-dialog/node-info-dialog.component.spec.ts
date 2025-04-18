import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeInfoDialogComponent } from './node-info-dialog.component';

describe('NodeInfoDialogComponent', () => {
  let component: NodeInfoDialogComponent;
  let fixture: ComponentFixture<NodeInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeInfoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
