import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MimeTypes, ZoomEvents } from '../file-preview-wrapper.component';
import { FilePreviewService } from '../file-preview.service';
import { BehaviorSubject } from 'rxjs';

export enum Icons {
  Zoom = 'zoom',
  Download = 'download',
  Edit = 'edit',
  Maximize = 'maximize',
  Thumbnail = 'thumbnail',
}

@Component({
  selector: 'app-file-toolbar',
  templateUrl: './file-toolbar.component.html',
  styleUrls: ['./file-toolbar.component.less']
})
export class FileToolbarComponent implements OnInit, OnChanges {
  constructor(
    private filePreviewService: FilePreviewService) { }

    @Input() allIcons: string[] = [
      Icons.Zoom,
      Icons.Download,
      Icons.Maximize,
    ];

  activeIcons: string[] = this.allIcons;
  @Input() maximized: boolean = false;
  @Input() minimized: boolean = false;
  @Input() readonly horizontal = false;
  @Input() readonly tooltipPosition: 'left' | 'right' = 'right';
  @Output() edit: BehaviorSubject<boolean> = new BehaviorSubject(false);
  @Output() readonly zoomEvents: EventEmitter<ZoomEvents> = new EventEmitter();
  @Output() readonly download: EventEmitter<void> = new EventEmitter();
  @Output() readonly maximize: EventEmitter<void> = new EventEmitter();
  @Output() readonly minimize: EventEmitter<void> = new EventEmitter();
  @Output() readonly thumbnail: EventEmitter<void> = new EventEmitter();
  @Output() readonly list: EventEmitter<void> = new EventEmitter();
  @Output() readonly delete: EventEmitter<void> = new EventEmitter();

  ngOnInit(): void {
    this.filePreviewService.filePreview.subscribe(x => {
      this.activeIcons = this.allIcons.slice();
      if(this.maximized)
        this.activeIcons.splice(this.activeIcons.findIndex(e => e === Icons.Maximize),1);
      if(!x.mimeType.startsWith(MimeTypes.Image))
        this.activeIcons.splice(this.activeIcons.findIndex(e => e === Icons.Zoom),1);
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.allIcons) {
      if (changes.allIcons.currentValue) {
        this.activeIcons = changes.allIcons.currentValue;
      }
    }
  }

  get tooltipClassName(): string {
    return this.tooltipPosition === 'right' ? 'right' : 'left';
  }

  typeZoomEvents = ZoomEvents;

  onZoom(event: ZoomEvents): void {
    this.zoomEvents.next(event);
  }

  onMaximize(event: Event): void {
    this.maximized = true;
    this.maximize.next();

  }

  onMinimize(event: Event): void {
    this.maximized = false;
    this.minimize.next();
  }

  onDownload(event: Event): void {
    this.download.next();
  }

  onEdit(event: Event): void {
    this.edit.next(true);
  }

  onSave(event: Event): void {
    this.edit.next(false);
  }

  onDelete(event: Event): void {
    this.delete.next();
  }

  onSwitchThumbnail(event: Event): void {
    this.thumbnail.next();
  }

  onSwitchList(event: Event): void {
    this.list.next();
  }
}
