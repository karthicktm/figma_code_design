import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType
} from '@angular/common/http';
import {
  Component, ElementRef, EventEmitter, Inject,
  OnDestroy,
  OnInit, ViewChild
} from '@angular/core';
import { HttpStatusCode } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import {
  DIALOG_DATA,
  EDSDialogComponent
} from 'src/app/portal/services/dialog.service';
import {
  Evidence,
  EvidenceNRORequest
} from 'src/app/projects/projects.interface';
import { ProjectsService, uploadByteLimit, uploadMaxNumberFilesAtOnce } from 'src/app/projects/projects.service';


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

const evidenceUploadResponseOnset = 'Duplicate'

@Component({
  selector: 'app-upload-referenced-evidence-dialog',
  templateUrl: './upload-referenced-evidence-dialog.component.html',
  styleUrls: ['./upload-referenced-evidence-dialog.component.less'],
})
export class UploadReferencedEvidenceDialogComponent
  extends EDSDialogComponent
  implements OnInit, OnDestroy {
  @ViewChild('fileSelectInput') fileSelectInput: ElementRef<HTMLInputElement>;
  @ViewChild('dialog') readonly dialogElement: ElementRef<HTMLElement>;
  projectId: string;
  lineItemUUId: string;
  name: string;
  parentEvidenceId: string;
  folders: string[];
  dialogState: DialogUploadState = DialogUploadState.Initialized;
  maxUploadFileSize = uploadByteLimit;
  maxNumberFilesAtOnce = uploadMaxNumberFilesAtOnce;
  public dialogResult: EventEmitter<string[]> = new EventEmitter();
  supportedMIME: string;
  fileList: FileState[] = [];
  errorMessage: string = '';
  failedFileList: FileState[] = [];
  errorDetail: string;
  applyToAllFilesIsChecked: boolean = false;
  packageId: string;
  tag: string;
  evidence: Evidence;
  status: string;
  type: string;
  constructor(
    @Inject(DIALOG_DATA) public inputData: {
      id?: string,
      name: string,
      packageId?: string,
      parentEvidenceId: string,
      parentId: string,
      projectId: string,
      tag?: string,
      lineItemId?: string,
      evidence?: Evidence,
      status?: string;
      type?: string;
    },
    private projectService: ProjectsService,
    private networkRollOutService: NetworkRollOutService,
  ) {
    super();
    this.projectId = inputData.projectId;
    this.lineItemUUId = inputData.lineItemId;
    this.name = inputData.name;
    if (!!inputData.parentEvidenceId) {
      this.parentEvidenceId = inputData.parentEvidenceId;
    }
    if (!!inputData.evidence) {
      this.evidence = inputData.evidence;
    }
    if (!!inputData.status) {
      this.status = inputData.status;
    }
    if (!!inputData.type) {
      this.type = inputData.type;
    }
    this.packageId = inputData.packageId;
    this.tag = inputData.tag;
  }

  ngOnInit(): void {
    this.supportedMIME = this.projectService.evidenceTypeMediaTypeMappingDefinition.mediaTypesToString();
  }

  get dialogTitle(): string {
    let title = `Upload evidence`;
    switch (this.dialogState) {
      case DialogUploadState.Initialized:
        title = `Upload evidence`;
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
        title = `Upload evidence`;
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
   * Set upload state to append
   */
  onSetFileUploadModeAppend(): void {
    let fileIds = [this.failedFileList[0].uuid];
    if (this.applyToAllFilesIsChecked) {
      fileIds = this.failedFileList.map(file => file.uuid);
    }
    this.setFileUploadMode(fileIds, FileUploadMode.Append);
    if (this.failedFileList.length > 0) {
      this.setStateUserInput();
    } else {
      this.setStateInitialized();
    }
  }

  /**
   * Set upload state to overwrite
   * @param fileIds file ids
   */
  onSetFileUploadModeOverwrite(): void {
    let fileIds = [this.failedFileList[0].uuid];
    if (this.applyToAllFilesIsChecked) {
      fileIds = this.failedFileList.map(file => file.uuid);
    }
    this.setFileUploadMode(fileIds, FileUploadMode.Overwrite);
    if (this.failedFileList.length > 0) {
      this.setStateUserInput();
    } else {
      this.setStateInitialized();
    }
  }

  /**
   * Set file upload mode
   * @param fileIds file ids
   * @param mode file upload mode
   */
  private setFileUploadMode(fileIds: string[], mode: FileUploadMode): void {
    for (const fileId of fileIds) {
      this.fileList.find(file => file.uuid === fileId).uploadMode = mode;
      const indexToRemove = this.failedFileList.findIndex(file => file.uuid === fileId);
      if (indexToRemove > -1) {
        this.failedFileList.splice(indexToRemove, 1);
      }
    }
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
    const htmlInputElement : HTMLInputElement = (event.target as HTMLInputElement)
    const inputFiles = htmlInputElement.files
    // validate number of files to be uploaded at once
    if (inputFiles.length > this.maxNumberFilesAtOnce) {
      this.errorMessage = `Exceeded maximum number of files to upload at once. Please upload number of files less than or equal to ${this.maxNumberFilesAtOnce}.`;
      this.dialogState = DialogUploadState.Error;
      // clear input when limit is exceeded
      htmlInputElement.value = ''
    }

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
          const referenceEvidence: EvidenceNRORequest = {
            projectId: this.projectId,
            name: file.inputFile.name,
            fileMIMEType: file.inputFile.type,
            type: undefined, // will be populated by the service
            scope: 'Both',
            tag: `eca-${this.projectId}-${this.name}`, // provide a tag to identify the file
            isAcceptanceRequired: true,
            isReplaceable: file.uploadMode === FileUploadMode.Overwrite,
          };
          if (!!this.parentEvidenceId) {
            referenceEvidence.parentEvidenceId = this.parentEvidenceId;
          }
          if (this.type === 'package-component' || this.type === 'package-evidence') {
            return this.uploadFileReworked(file);
          }
          else {
            return this.uploadFile(file, referenceEvidence)
          }
        })
      ).subscribe(responses => {
        if (responses.every(response => response === true)) {
          this.dialogState = DialogUploadState.Success;
        } else if (this.errorMessage.length > 0 && this.errorDetail.length > 0) {
          this.dialogState = DialogUploadState.Error;
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

  private onFileUploaded(): void {
    const fileNames = this.fileList
      .filter(fileState => fileState.uploadState === FileUploadState.Success)
      .map(fileState => fileState.inputFile.name);
    if (fileNames && fileNames.length > 0) this.dialogResult.emit(fileNames);
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
    evidence: EvidenceNRORequest,
  ): Observable<boolean> {
    const uploadObservable = this.packageId
      ? this.projectService.uploadEvidenceFile(
        {
          evidenceId: undefined,
          fileMIMEType: file.inputFile.type,
          isAcceptanceRequired: true,
          name: file.inputFile.name,
          projectId: this.projectId,
          scope: 'Both',
          type: undefined,
          parentEvidenceId: this.parentEvidenceId,
          tag: this.tag,
        },
        file.inputFile,
        this.packageId,
      )
      : this.networkRollOutService.uploadEvidenceFileToLineItem(
        evidence,
        file.inputFile,
        this.projectId,
        this.lineItemUUId,
      )
    return uploadObservable.pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          file.progress = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          return true;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = 'The following files failed to upload. Please try again.'
        // if status 409 file already exists

        let responseMessage = '';
        let responseMessageDescription = '';
        if (!(error.error instanceof ErrorEvent)) {
          responseMessage = `${error.error.responseMessage}`
          responseMessageDescription = `${error.error.responseMessageDescription}`
        }
        if (error.status === 409 && responseMessageDescription.length > 0 && responseMessageDescription.startsWith(evidenceUploadResponseOnset)) {
          [this.errorMessage, this.errorDetail] = responseMessageDescription.split('::')
        }
        // check if file is already in failed file list otherwise add it
        else if (error.status === HttpStatusCode.Conflict && !this.failedFileList.some(failedFile => failedFile.uuid === file.uuid)) {
          this.failedFileList.push(file); // add file to failed file list
        }
        return of(false);
      })
    );
  }

  private uploadFileReworked(
    file: FileState,
  ): Observable<boolean> {
    const request = {
      evidenceId: undefined,
      parentEvidenceId: this.parentEvidenceId,
      name: file.inputFile.name,
      projectId: this.projectId,
      type: undefined,
      scope: 'Customer',
      tag: this.tag,
      fileMIMEType: file.inputFile.type,
      isAcceptanceRequired: true,
    }
    let uploadObservable;
    if (this.type === 'package-component') {
      uploadObservable =
        this.networkRollOutService.uploadEvidenceFileToLineItem(
          request,
          file.inputFile,
          this.projectId,
          this.lineItemUUId,
        );
    }
    if (this.type === 'package-evidence') {
      uploadObservable =
        this.networkRollOutService.uploadRelatedEvidenceFile(
          request,
          file.inputFile,
        );
    }
    return uploadObservable.pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          file.progress = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          if (this.type === 'package-component' || this.type === 'package-evidence') {
            this.dialog.hide();
            this.dialogResult.emit(event.body);
            return event.body;
          }
          else {
            return true;
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = 'The following files failed to upload. Please try again.'
        // if status 409 file already exists
        // check if file is already in failed file list otherwise add it
        if (error.status === HttpStatusCode.Conflict && !this.failedFileList.some(failedFile => failedFile.uuid === file.uuid)) {
          this.failedFileList.push(file); // add file to failed file list
        }
        return of(false);
      })
    );
  }
  /**
   * Click upload button inject to input
   */
  onFileSelectInput(): void {
    this.fileSelectInput.nativeElement.click();
  }

  ngOnDestroy(): void {
    this.dialog.destroy();
  }
}
