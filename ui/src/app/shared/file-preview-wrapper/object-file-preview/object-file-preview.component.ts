import { Component, Input} from '@angular/core';

@Component({
  selector: 'app-object-file-preview',
  templateUrl: './object-file-preview.component.html',
  styleUrls: ['./object-file-preview.component.less']
})
export class ObjectFilePreviewComponent {
  @Input() public offsetWidth?: Number;
  @Input() public offsetHeight?: Number;
  @Input() public evidenceUrl: string = '';
  @Input() public type: string = '';
}
