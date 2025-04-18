import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, signal } from '@angular/core';
import { FormatBytesPipe } from '../format-bytes.pipe';

@Component({
  selector: 'app-file-upload-button',
  standalone: true,
  imports: [
    CommonModule,
    FormatBytesPipe,
  ],
  templateUrl: './file-upload-button.component.html',
  styleUrl: './file-upload-button.component.less'
})
export class FileUploadButtonComponent implements OnInit {
  @ViewChild('fileSelectInput') fileSelectInput: ElementRef<HTMLInputElement>;
  @Input()
  buttonText: string;
  @Input()
  accept: string;
  @Input()
  initialFile?: File;
  @Input()
  downloadEnabled: boolean = false;
  @Input()
  type: undefined | 'simple-icon' = undefined;
  @Output()
  public fileChange = new EventEmitter<Event>();

  filesNames = signal<File[]>([]);

  ngOnInit(): void {
    if (this.initialFile) this.filesNames.set([this.initialFile]);
  }

  onFileChange(event: Event): void {
    const target = (event.target instanceof HTMLInputElement) ? event.target : undefined;
    if (target) this.filesNames.set(Array.from(target.files || []));
    this.fileChange.emit(event);
  }

  downloadFile(file: File): void {
    const downloadUrl = window.URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    link.dispatchEvent(new MouseEvent('click'));
    window.URL.revokeObjectURL(downloadUrl);
  }
}
