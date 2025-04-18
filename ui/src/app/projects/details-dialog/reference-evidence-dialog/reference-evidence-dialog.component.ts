import {
  Component,
  EventEmitter,
  ViewChild,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpStatusCode,
} from '@angular/common/http';
import {
  DIALOG_DATA,
  EDSDialogComponent,
} from 'src/app/portal/services/dialog.service';
import { ProjectsService, uploadByteLimit } from '../../projects.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import {
  EvidenceRequest,
} from 'src/app/projects/projects.interface';
import {
  DialogData,
  APICallStatus,
} from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { NotificationService } from 'src/app/portal/services/notification.service';
enum UploadState {
  Success = 'SUCCESS',
  Error = 'ERROR',
}

interface FileState {
  fileName: string;
  size: number;
  state: UploadState;
}
@Component({
  selector: 'app-reference-evidence-dialog',
  templateUrl: './reference-evidence-dialog.component.html',
  styleUrls: ['./reference-evidence-dialog.component.less'],
})
export class ReferenceEvidenceDialogComponent
  extends EDSDialogComponent
  implements OnInit, OnDestroy
{
  @ViewChild('fileSelectInput') fileSelectInput: ElementRef<HTMLInputElement>;
  @ViewChild('dialog') readonly dialogElement: ElementRef<HTMLElement>;
  packageId: string;
  projectId: string;
  folders: string[];
  maxUploadFileSize = uploadByteLimit;
  public dialogResult: EventEmitter<boolean> = new EventEmitter();
  supportedMIME: string;

  constructor(
    @Inject(DIALOG_DATA) public inputData: any,
    private projectService: ProjectsService,
    private dialogService: DialogService,
    private notificationService: NotificationService
  ) {
    super();
    this.packageId = inputData.packageId;
    this.projectId = inputData.projectId;
  }

  ngOnInit(): void {
    this.supportedMIME = this.projectService.evidenceTypeMediaTypeMappingDefinition.mediaTypesToString();
  }

  /**
   * upload a file function with service
   * Improvement: Validation for add white list of allowed mime type
   * @param package id
   * @returns boolean
   */
  onFileChange(event: any): void {
    event.preventDefault();
    this.dialog.hide();
    const files: File[] = event.target.files;
    // this should not be possible, but checking anyway.
    if (files.length < 1) {
      return;
    }

    if (!!files && files.length > 0) {
      const filesToBeUploaded = Array.from(files);
      const uploadFileStates = filesToBeUploaded.map((file) => {
        return { fileName: file.name, size: file.size } as FileState;
      });
      const dialogData: DialogData = {
        dialogueTitle: 'Uploading file',
        show: APICallStatus.Loading,
        statusMessage: 'File(s) are currently being uploaded.',
      };
      const dialogMessage = this.dialogService.createDialog(
        DialogMessageComponent,
        dialogData
      );

      filesToBeUploaded.forEach((file: File) => {
        const referenceEvidence = {
          evidenceId: undefined,
          name: file.name,
          projectId: this.projectId,
          type: undefined,
          scope: 'Customer',
          fileMIMEType: file.type,
          tag: 'non-acceptance',
          isAcceptanceRequired: false,
        };
        this.uploadFile(
          file,
          referenceEvidence,
          dialogMessage,
          uploadFileStates,
        );
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
    file: File,
    evidence: EvidenceRequest,
    dialogMessage,
    uploadFileStates: FileState[]
  ): void {
    if (file.size >= this.maxUploadFileSize) {
      this.updateDialogState(file.name, UploadState.Error, dialogMessage, uploadFileStates);
      return;
    }
    this.projectService
      .uploadEvidenceFile(evidence, file, this.packageId)
      .subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.Response) {
            this.updateDialogState(
              file.name,
              UploadState.Success,
              dialogMessage,
              uploadFileStates
            );
            this.notificationService.showNotification({
              title: 'File uploaded successfully',
              description: `Uploaded ${file.name}.`,
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          this.updateDialogState(
            file.name,
            UploadState.Error,
            dialogMessage,
            uploadFileStates
          );
          let additionalMessage = '';
          dialogMessage.instance.show = APICallStatus.Error;
          if(err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine){
            this.notificationService.showNotification({
              title: 'Failed to upload!',
              description: `There was an error while uploading ${file.name}: ${err.statusText}` + 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.',
            }, true);
            additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
          }
          else{
            this.notificationService.showNotification({
              title: 'Failed to upload!',
              description: `There was an error while uploading ${file.name}: ${err.statusText}` + 'Please follow the FAQ doc for further steps',
            }, true);
            additionalMessage = '\n Please follow the FAQ doc for further steps';
          }
          dialogMessage.instance.statusMessage = additionalMessage;
          dialogMessage.instance.dialogueTitle = 'Failed to upload!';
          dialogMessage.instance.additionalMessage = '';
          dialogMessage.instance.actionOn.next('FAQ');
        },
      });
  }
  /**
   * Update the upload progess and show the success and failure message
   * @param fileName
   * @param state
   * @param dialogMessage
   * @param uploadFileStates
   */
  private updateDialogState(
    fileName: string,
    state: UploadState,
    dialogMessage,
    uploadFileStates: FileState[]
  ): void {
    const fileState = uploadFileStates.find(
      (file) => file.fileName === fileName
    );
    fileState.state = state;
    const total = uploadFileStates.length;
    const uploadedFiles = uploadFileStates.filter((file) => !!file.state);
    if (uploadedFiles.length > 0) {
      if (uploadedFiles.length < uploadFileStates.length) {
        const uploaded = uploadedFiles.length;
        dialogMessage.instance.statusMessage = `${uploaded} out of ${total} processed...`;
        dialogMessage.instance.progressValues = {
          value: (uploaded / total) * 100,
          maxValue: 100,
        };
      } else {
        dialogMessage.instance.progressValues = undefined;

        const failedFiles = uploadFileStates.find(
          (file) => file.state === UploadState.Error
        );
        if (!failedFiles) {
          dialogMessage.instance.show = APICallStatus.Success;
          dialogMessage.instance.additionalMessage = `All files uploaded successfully.`;
          dialogMessage.instance.statusMessage = `${total} out of ${total} file(s) uploaded successfully.`;
          this.dialogResult.emit(true);
        } else {
          dialogMessage.instance.show = APICallStatus.Error;
          dialogMessage.instance.additionalMessage = `Some files failed to upload.`;
          const errorResults = [
            { name: 'Successfully uploaded', elements: [] },
            { name: 'Failed to upload', elements: [] },
          ];
          uploadFileStates.forEach((file) => {
            if (file.state === UploadState.Success) {
              errorResults[0].elements.push({ elementName: file.fileName });
            } else {

              const message =
                file.size >= this.maxUploadFileSize
                  ? `exceeds ${this.projectService.formatBytes(uploadByteLimit)}`
                  : undefined;
              errorResults[1].elements.push({
                elementName: file.fileName,
                message,
              });
            }
          });

          if (errorResults[0].elements.length === 0) {
            errorResults.shift();
            this.dialogResult.emit(false);
          } else {
            this.dialogResult.emit(true);
          }
          dialogMessage.instance.results = errorResults;
        }
      }
    }
  }

  /**
   * click upload button inject to input
   *
   */
  uploadReferenceFiles(): void {
    this.fileSelectInput.nativeElement.click();
  }

  ngOnDestroy(): void {
    this.dialog.destroy();
  }
}
