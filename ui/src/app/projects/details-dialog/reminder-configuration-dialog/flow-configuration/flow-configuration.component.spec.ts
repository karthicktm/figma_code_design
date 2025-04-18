import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowConfigurationComponent } from './flow-configuration.component';

describe('FlowConfigurationComponent', () => {
  let component: FlowConfigurationComponent;
  let fixture: ComponentFixture<FlowConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
