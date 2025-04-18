import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
  OnDestroy,
  EventEmitter,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { catchError, tap } from 'rxjs/operators';
import { EMPTY, Observable, forkJoin } from 'rxjs';
import {
  DIALOG_DATA,
  EDSDialogComponent,
} from 'src/app/portal/services/dialog.service';
import { Dialog } from '@eds/vanilla';
import { Evidence, EvidenceRequest } from 'src/app/projects/projects.interface';
import { ProjectsService, uploadByteLimit } from '../../projects.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';

export interface DocumentDialogData {
  projectId: string;
  packageId: string;
  isNewPackage?: boolean;
  isViewOnly?: boolean;
}
@Component({
  selector: 'app-add-new-document-dialog',
  templateUrl: './add-new-document-dialog.component.html',
  styleUrls: ['./add-new-document-dialog.component.less'],
})
export class AddNewDocumentDialogComponent
  extends EDSDialogComponent
  implements OnInit, OnDestroy
{
  @ViewChild('fileSelectInput') fileSelectInput: ElementRef<HTMLInputElement>;
  @ViewChild('dialog') readonly dialogElement: ElementRef<HTMLElement>;
  fileForm: FormGroup<{
    tagAssignment: FormControl<string>,
    newTagInput: FormControl<string>,
  }>;
  packageId: string;
  projectId: string;
  isNewPackage: boolean;
  isViewOnly: boolean;
  tags: string[];
  selectedTag: string;
  dialog: Dialog;
  public dialogResult: EventEmitter<boolean> = new EventEmitter();
  public fileUploadResponse: EventEmitter<any> = new EventEmitter();
  supportedMIME: string;
  uploadingFile: boolean;

  constructor(
    @Inject(DIALOG_DATA) public inputData: DocumentDialogData,
    private projectService: ProjectsService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private networkRollOutService: NetworkRollOutService
  ) {
    super();
    this.packageId = inputData.packageId;
    this.projectId = inputData.projectId;
    this.isNewPackage = inputData.isNewPackage ? inputData.isNewPackage : false ;
    this.isViewOnly = inputData.isViewOnly ? inputData.isViewOnly : false;
    this.fileForm = this.fb.group({
      tagAssignment: [''],
      newTagInput: [''],
    });
  }
  ngOnInit(): void {
    if(this.packageId !== undefined) {
      this.getTags();
    }
    this.supportedMIME = this.projectService.evidenceTypeMediaTypeMappingDefinition.mediaTypesToString();
  }

  get tagAssignment(): FormControl<string> {
    return this.fileForm.controls.tagAssignment;
  }

  get newTagInput(): FormControl<string> {
    return this.fileForm.controls.newTagInput;
  }

  /**
   * get the list of containers
   */
  public getTags(): void {
    this.projectService.getTags(this.packageId).subscribe({
      next: (res) => {
        this.tags = res.map(
          (value) => value.tag
        );
      },
      error: (error) => {
        // Do something to handle error
      },
    });
  }

  onSelectTag(tag: string): void {
    this.selectedTag = tag;
  }

  uploadFileDisabled(): boolean {
    if (!this.tagAssignment.value) {
      return true;
    }

    if (this.tagAssignment.value === 'existing' && !this.selectedTag) {
      return true;
    }

    if (this.tagAssignment.value === 'new' && !this.newTagInput.value) {
      return true;
    }

    return false;
  }

  /**
   * Event handler for HTMLInputElement
   */
  onFileChange(event: Event): void {
    event.preventDefault();
    if (!(event.target instanceof HTMLInputElement)) return;
    const files: FileList = event.target.files;
    // this should not be possible, but checking anyway.
    if (files.length < 1) {
      return;
    }
    if (!!files && files.length > 0) {
      const filesToBeUploaded = Array.from(files);
      let tag = '';
      if (this.tagAssignment.value === 'existing' && !!this.selectedTag) {
        tag = this.selectedTag;
      }
      if (this.tagAssignment.value === 'new' && !!this.newTagInput.value) {
        tag = this.newTagInput.value;
      }
      const filesWithValidationError: File[] = [];
      const uploadObservables: Observable<Evidence>[] = [];
      filesToBeUploaded.forEach((file: File) => {
        if (file.size >= uploadByteLimit) {
          filesWithValidationError.push(file);
          return;
        };
        const attachedEvidence: EvidenceRequest = {
          evidenceId: undefined,
          name: file.name,
          projectId: this.projectId,
          type: undefined,
          scope: 'Customer',
          fileMIMEType: file.type,
          tag,
          isAcceptanceRequired: !this.isViewOnly,
        };
        uploadObservables.push(this.uploadFileForNewPackage(attachedEvidence, file));
      });

      if (filesWithValidationError.length > 0) {
        this.notificationService.showNotification({
          title: `Files exceed file size limit of ${this.projectService.formatBytes(uploadByteLimit)}`,
          description: `${filesWithValidationError
            .map(file => `${file.name} ${this.projectService.formatBytes(file.size)}`)
            .join('\n')} \n${filesWithValidationError.length > 1 ? 'are' : 'is'} rejected to be uploaded.`,
          icon: 'icon-fault',
          stripeColor: 'red',
          isBanner: true,
        })
      }

      if (uploadObservables.length > 0) {
        forkJoin(uploadObservables).subscribe({
          next: () => this.dialog.hide(),
          error: () => this.dialog.hide(),
        });
      }

    }
  }

  private uploadFileForNewPackage(evidence: EvidenceRequest, file: File): Observable<Evidence> {
    this.uploadingFile = true;
    return this.networkRollOutService.uploadEvidenceFile(evidence, file, this.projectId, this.packageId).pipe(
      tap((response: Evidence) => {
        this.fileUploadResponse.emit(response);
        this.dialogResult.emit(true);
      }),
      catchError((err: any) => {
        this.uploadingFile = false;
        this.notificationService.showNotification({
          title: 'Error uploading file',
          description: `There was an error while uploading ${file.name}: ${err.message}`,
        });
        this.fileUploadResponse.emit(null);
        this.dialogResult.emit(false);
        return EMPTY;
      })
    );
  }

  /**
   * click upload button inject to input
   *
   */
  uploadNewFile(): void {
    this.fileSelectInput.nativeElement.click();
  }

  ngOnDestroy(): void {
    this.dialog.destroy();
  }
}
