import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType
} from '@angular/common/http';
import {
  Component, ElementRef, EventEmitter, Inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DIALOG_DATA,
  EDSDialogComponent
} from 'src/app/portal/services/dialog.service';
import { ProjectsService, uploadByteLimit } from 'src/app/projects/projects.service';
import CertificateUtils from '../certificate-utilities';


enum DialogUploadState {
  Success = 'SUCCESS',
  Error = 'ERROR',
  Initialized = 'INITIALIZED',
  UserInput = 'USER_INPUT',
  Uploading = 'UPLOADING',
}

enum FileUploadMode {
  Default = 'DEFAULT',
  Append = 'APPEND',
  Overwrite = 'OVERWRITE',
}

enum FileUploadState {
  Success = 'SUCCESS',
  Error = 'ERROR',
}

interface FileState {
  uuid: string;
  inputFile: File,
  uploadState: FileUploadState;
  uploadMode: FileUploadMode;
  progress: number;
}

export interface CertificateDocumentRequest {
  certificateRequestId: string;
  fileName: string;
  mimeType: string;
  type: string;
  tag: string;
}

@Component({
  selector: 'app-certificate-document-upload-dialog',
  templateUrl: './certificate-document-upload-dialog.component.html',
  styleUrls: ['./certificate-document-upload-dialog.component.less'],
})
export class CertificateDocumentUploadDialogComponent
  extends EDSDialogComponent
  implements OnDestroy {
  @ViewChild('fileSelectInput') fileSelectInput: ElementRef<HTMLInputElement>;
  @ViewChild('dialog') readonly dialogElement: ElementRef<HTMLElement>;
  tagNameValue: string = '';
  tagNameMaxLength: number = CertificateUtils.certificateTagNameLength;
  projectId: string;
  dialogState: DialogUploadState = DialogUploadState.Initialized;
  maxUploadFileSize = uploadByteLimit;
  public dialogResult: EventEmitter<string[]> = new EventEmitter();
  fileList: FileState[] = [];
  errorMessage: string = '';
  failedFileList: FileState[] = [];
  certReqDocumentIds: string[] = [];
  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      projectId: string
    },
    private projectService: ProjectsService
  ) {
    super();
    this.projectId = inputData.projectId
  }

  get dialogTitle(): string {
    let title = `Upload reference documents`;
    switch (this.dialogState) {
      case DialogUploadState.Initialized:
        title = `Upload reference documents`;
        break;
      case DialogUploadState.Success:
        title = `File(s) successfully uploaded`;
        break;
      case DialogUploadState.Error:
        title = `File(s) failed to upload`;
        break;
      case DialogUploadState.UserInput:
        title = `The file ${this.fileList.find(file => file.uuid === this.failedFileList[0].uuid).inputFile.name} already exists. What would you like to do?`;
        break;
      default:
        title = `Upload reference documents`;
        break;
    }
    return title;
  }

  /**
   * State is initialized
   */
  get hasStateInitialized(): boolean {
    return this.dialogState === DialogUploadState.Initialized;
  }

  /**
   * State is uploading
   */
  get hasStateUploading(): boolean {
    return this.dialogState === DialogUploadState.Uploading;
  }

  /**
   * State is failed
   */
  get hasStateFailed(): boolean {
    return this.dialogState === DialogUploadState.Error;
  }

  /**
   * State is complete
   */
  get hasStateCompleted(): boolean {
    return this.dialogState === DialogUploadState.Success;
  }

  /**
   * State is user input
   */
  get hasStateUserInput(): boolean {
    return this.dialogState === DialogUploadState.UserInput;
  }

  /**
   * Set state to initialized
   */
  setStateInitialized(): void {
    this.dialogState = DialogUploadState.Initialized;
  }

  /**
   * Set state to user input
   */
  setStateUserInput(): void {
    this.dialogState = DialogUploadState.UserInput;
  }
  /**
   * Set state to error
   */
  setStateError(): void {
    this.dialogState = DialogUploadState.Error;
  }

  /**
   * Add files to upload list
   * @param event
   */
  onAddFiles(event: Event): void {
    // reset error message
    this.errorMessage = '';
    this.failedFileList = [];

    // get files from event
    const inputFiles = (event.target as HTMLInputElement).files

    // check if files are valid
    const inputFilesArray = Array.from(inputFiles).map(inputFile => ({
      uuid: crypto.randomUUID(),
      inputFile,
      uploadState: inputFile.size < this.maxUploadFileSize ? FileUploadState.Success : FileUploadState.Error,
      uploadMode: FileUploadMode.Default,
      progress: 0,
    }));
    const bigFiles = inputFilesArray.filter(file => file.uploadState === FileUploadState.Error);
    if (bigFiles.length > 0) {
      this.errorMessage = `The following files are too large to upload. Please upload files smaller than ${this.projectService.formatBytes(uploadByteLimit)}.`;
      this.dialogState = DialogUploadState.Error;
      this.failedFileList = bigFiles;
    }

    this.fileList = this.fileList.concat(
      inputFilesArray
        .filter(file => !this.fileList
          .map(existingFile => existingFile.inputFile.name)
          .includes(file.inputFile.name)
        )
        .filter(file => file.uploadState === FileUploadState.Success));
  }

  onClose(): void {
    this.onFileUploaded();
    this.dialog.hide();
  }

  /**
   * Remove file from file list
   * @param uuid
   */
  onDeleteFile(uuid: string): void {
    // remove file from file list
    const fileListIndexToRemove = this.fileList.findIndex(file => file.uuid === uuid);
    if (fileListIndexToRemove > -1) {
      this.fileList.splice(fileListIndexToRemove, 1);
    }
    const failedFileListIndexToRemove = this.failedFileList.findIndex(file => file.uuid === uuid);
    if (failedFileListIndexToRemove > -1) {
      this.failedFileList.splice(failedFileListIndexToRemove, 1);
    }
  }

  /**
   * upload a file function with service
   * Improvement: Validation for add white list of allowed mime type
   * @param package id
   * @returns boolean
   */
  onUploadFiles(): void {
    this.dialogState = DialogUploadState.Uploading;

    // this should not be possible, but checking anyway.
    if (this.fileList.length < 1) {
      return;
    }

    if (!!this.fileList && this.fileList.length > 0) {
      forkJoin(
        this.fileList.map(file => {
          const certificateDocumentData: CertificateDocumentRequest = {
            fileName: file.inputFile.name,
            tag: this.tagNameValue,
            mimeType: file.inputFile.type,
            certificateRequestId: null,
            type: null
          };
          return this.uploadFile(file, certificateDocumentData)
        })
      ).subscribe(responses => {
        if (responses.every(response => response === true)) {
          this.dialogState = DialogUploadState.Success;
        } else if (this.failedFileList.length > 0) {
          this.dialogState = DialogUploadState.UserInput;
        } else {
          this.errorMessage = 'Error uploading the files. Please try again.'
          this.dialogState = DialogUploadState.Error;
        }
        if (responses.find(response => response === true)) {
          this.onFileUploaded();
        }
      });
    }
  }

  /**
   * Upload multiple files along with the evidence object
   * @param file
   * @param evidence
   * @param dialogMessage
   * @param uploadFileStates
   */
  private uploadFile(
    file: FileState,
    certDocumentRequest: CertificateDocumentRequest,
  ): Observable<boolean> {
    const uploadObservable =
      this.projectService.uploadCertDocumentFile(
        certDocumentRequest,
        file.inputFile,
        this.projectId
      )
    return uploadObservable.pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          file.progress = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          if (event.body) {
            if (event.body.certificateRequestDocumentId) {
              // save document ids
              this.certReqDocumentIds.push(event.body.certificateRequestDocumentId)
            }
          }
          return true;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = 'The following files failed to upload. Please try again.'
        // if status 409 file already exists
        // check if file is already in failed file list otherwise add it
        if (error.status === 409 && !this.failedFileList.some(failedFile => failedFile.uuid === file.uuid)) {
          this.failedFileList.push(file); // add file to failed file list
        }
        return of(false);
      })
    );
  }

  private onFileUploaded(): void {
    const fileNames = this.fileList
      .filter(fileState => fileState.uploadState === FileUploadState.Success)
      .map(fileState => fileState.inputFile.name);
    if (fileNames && fileNames.length > 0) this.dialogResult.emit(this.certReqDocumentIds);
  }

  /**
   * Click upload button inject to input
   */
  onFileSelectInput(): void {
    this.fileSelectInput.nativeElement.click();
  }

  validateTagName(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    if (input.value.length > this.tagNameMaxLength) {
      this.tagNameValue = input.value.slice(0, this.tagNameMaxLength);
      input.value = this.tagNameValue
    } else {
      this.tagNameValue = input.value;
    }
  }

  ngOnDestroy(): void {
    this.dialog.destroy();
  }
}
