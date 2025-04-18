import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatoriesCommentComponent } from '../certificate-request-details/signatories-comment/signatories-comment.component';

describe('SignatoriesCommentComponent', () => {
  let component: SignatoriesCommentComponent;
  let fixture: ComponentFixture<SignatoriesCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignatoriesCommentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignatoriesCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
