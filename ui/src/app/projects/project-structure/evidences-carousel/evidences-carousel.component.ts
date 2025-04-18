import { Component, computed, effect, ElementRef, HostListener, input, model, OnDestroy, signal, viewChild, WritableSignal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { catchError, firstValueFrom, lastValueFrom, map, Observable, of, ReplaySubject, shareReplay, Subscription, tap } from 'rxjs';
import { Carousel } from '@eds/vanilla';
import { CustomerAcceptanceStatus, EvidenceRemark, EvidenceStatusUpdate, MilestoneEvidenceRow, PackageDetails, RelatedEvidence } from '../../projects.interface';
import { DetailsContextualService } from '../../project/acceptance-package-details/details-contextual.service';
import { FilePreview, FilePreviewService } from 'src/app/shared/file-preview-wrapper/file-preview.service';
import { ProjectsService } from '../../projects.service';
import { SharedModule } from 'src/app/shared/shared.module';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { CommentHistoryComponent } from '../../project/acceptance-package-details/comment-history/comment-history.component';
import { EvidenceHistoryComponent } from '../../project/acceptance-package-details/evidence-history/evidence-history.component';
import { EvidenceRemarksComponent } from '../evidence-remarks/evidence-remarks.component';
import { AcceptancePackageService, ComponentActionPermission, RoleInPackage } from '../../project/acceptance-package.service';
import { APICallStatus, DialogData } from 'src/app/shared/dialog-data.interface';
import { DialogMessageComponent } from 'src/app/shared/dialog-message/dialog-message.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { RelatedEvidencesComponent } from '../../project/related-evidences/related-evidences.component';

interface ExtendedMilestoneEvidenceRow extends MilestoneEvidenceRow {
  toBeLoaded?: boolean
};

@Component({
  selector: 'app-evidences-carousel',
  standalone: true,
  imports: [
    AsyncPipe,
    SharedModule,
    CommentHistoryComponent,
    EvidenceHistoryComponent,
    EvidenceRemarksComponent,
    RelatedEvidencesComponent,
],
  templateUrl: './evidences-carousel.component.html',
  styleUrl: './evidences-carousel.component.less'
})
export class EvidencesCarouselComponent implements OnDestroy {
  // selectedEvidence is used only to identify initialSlide when creating Carousel object. Overall use currentSlideIndex() to find out current slide.
  readonly selectedEvidence = input.required<MilestoneEvidenceRow>();
  readonly totalRecords = input.required<number>();
  readonly limit = input.required<number>();
  readonly offset = input.required<number>();
  readonly evidences = input.required<ExtendedMilestoneEvidenceRow[]>();
  readonly page = model<'next' | 'prev'>();
  readonly currentSlideIndex = signal<number>(0);
  readonly fileToolbarIcons = signal<string[]>(['zoom', 'download']);
  readonly packageDetails = input<PackageDetails>();
  readonly reloadHistoryStatus: ReplaySubject<boolean> = new ReplaySubject(1);

  readonly carouselElementRef = viewChild.required<ElementRef<HTMLElement>>('carousel');
  carousel: Carousel;
  slidesData = computed<{ viewId: number }[]>(() => {
    const totalRecords = this.totalRecords();
    if (!this.slidesArray) {
      const slidesArray = new Array<MilestoneEvidenceRow>(totalRecords)
        .fill({ viewId: undefined } as any).map((_, index) => {
          return { viewId: index };
        });
      this.slidesArray = slidesArray;

      const dataArray = new Array<MilestoneEvidenceRow>(totalRecords)
        .fill({ fileUrlFetch: undefined } as any).map(() => {
          return { data: signal(undefined), fileUrlFetch: signal(undefined) };
        });
      this.dataArray = dataArray;
    }

    return this.slidesArray;
  });
  dataURIMap = new Map<string, FilePreview>();
  relatedEvidencesObservableMap = new Map<string, Observable<RelatedEvidence[]>>;
  slidesArray: { viewId: number }[];
  dataArray: { data: WritableSignal<MilestoneEvidenceRow>, fileUrlFetch: WritableSignal<Observable<FilePreview>> }[];
  prevOffset: number;
  prevLimit: number;
  prevEvidences: MilestoneEvidenceRow[];
  @HostListener('document:keyup.escape', ['$event']) onKeyEscape(event: any): void {
    this.close();
  };
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft') {
      this.carousel.prevSlide();
    } else if (event.code === 'ArrowRight') {
      this.carousel.nextSlide();
    }
  };

  readonly isVerdictSubmissionAllowed = signal<boolean>(false);
  readonly isRemarkDisabled = signal<boolean>(true);

  private readonly subscription = new Subscription();
  AcceptancePackageUtils = AcceptancePackageUtils;
  ComponentActionPermission = ComponentActionPermission;
  CustomerAcceptanceStatus = CustomerAcceptanceStatus;
  private readonly preloadClosestPageThreshold = 1;

  constructor(
    private detailsService: DetailsContextualService,
    private dialogService: DialogService,
    private projectsService: ProjectsService,
    private packageService: AcceptancePackageService,
    private filePreviewService: FilePreviewService,
  ) {
    effect(async () => {
      // Calling dependency
      this.slidesData();

      // Only if changed together update
      if ((this.offset() !== this.prevOffset || this.limit() !== this.prevLimit) && this.evidences() !== this.prevEvidences) {
        this.prevOffset = this.offset();
        this.prevLimit = this.limit();
        this.prevEvidences = this.evidences();
        this.slidesArray.forEach(async (_, index) => {
          const data = this.evidences()[index - this.offset()];
          if (data) {
            if (data.toBeLoaded) {
              this.dataArray[index].data.set(data); // load internalId first so that initialSlide of carousel can be found
              const evidenceDetails = await lastValueFrom(this.retrieveEvidenceDetail(data.internalId));
              this.dataArray[index].data.set(evidenceDetails);
              this.dataArray[index].fileUrlFetch.set(evidenceDetails?.internalId ? this.retrieveFileUrl(evidenceDetails) : undefined);
            } else {
              this.dataArray[index].data.set(data);
              this.dataArray[index].fileUrlFetch.set(data?.internalId ? this.retrieveFileUrl(data) : undefined);
            }
          }
        })
      }
      const currentSlideIndex = this.currentSlideIndex();
      const currentSlide = this.dataArray[currentSlideIndex].data();
      if (currentSlide) {
        const filePreview = this.dataURIMap.get(currentSlide.internalId)
          || await lastValueFrom(this.retrieveFileUrl(currentSlide));
        this.filePreviewService.filePreview.next(filePreview);
        this.filePreviewService.loading.next(false);
      }

      if (!this.carousel) {
        const carouselDOM = this.carouselElementRef()?.nativeElement;
        if (carouselDOM) {
          const initialSlide = this.dataArray.findIndex(slide => slide?.data()?.internalId === this.selectedEvidence()?.internalId);
          this.currentSlideIndex.set(initialSlide);
          const carousel = this.carousel = new Carousel(carouselDOM, { initialSlide });
          const onSlideChange = (): void => {
            const prevSlideIndex = this.currentSlideIndex();
            const currSlideIndex = carousel.getCurrentSlide();
            if ((currSlideIndex - prevSlideIndex === 1) || (prevSlideIndex > currSlideIndex && currSlideIndex === 0 && prevSlideIndex !== 1)) this.onNext();
            if ((prevSlideIndex - currSlideIndex === 1) || (prevSlideIndex <= currSlideIndex && prevSlideIndex === 0 && currSlideIndex !== 1)) this.onPrev();
            this.currentSlideIndex.set(currSlideIndex);
          }
          carousel.onSlideChange = onSlideChange;
          carousel.init();
        }
        else {
          console.error('No DOM defined for carousel.')
        }
      }
    }, { allowSignalWrites: true });

    this.subscription.add(this.packageService.currentPackageUser.subscribe(pkgUsr => {
      if (pkgUsr.userRole) {
        this.isVerdictSubmissionAllowed.set(pkgUsr.userRole === RoleInPackage.CustomerApprover);
      }
    }));

    effect(() => {
      const packageStatus = this.packageDetails()?.status;
      if (this.isVerdictSubmissionAllowed()
        && (packageStatus === CustomerAcceptanceStatus.CustomerNewPendingApproval || packageStatus === CustomerAcceptanceStatus.CustomerReworkedPendingApproval)
      ) {
        firstValueFrom(this.packageService.currentPackageUserActionInProgress).then((isInProgress) => {
          this.isRemarkDisabled.set(!isInProgress);
        });
      } else {
        this.isRemarkDisabled.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.close();
    this.carousel.destroy();
    this.subscription.unsubscribe();
  }

  isUserAuthorized(permission: string): Observable<boolean> {
    return this.packageService.isUserAuthorizedInPackage(permission);
  }

  submitDecision(details: { decision: 'Reject' | 'Approve', evidence: MilestoneEvidenceRow }): void {
    const { decision, evidence } = details;
    let statusValue: CustomerAcceptanceStatus;
    let remarkValue = '';

    if (decision === 'Reject') {
      statusValue = CustomerAcceptanceStatus.CustomerRejected;
      remarkValue = EvidenceRemark.MINOR;
    } else {
      statusValue = CustomerAcceptanceStatus.CustomerApproved;
      remarkValue = EvidenceRemark.OK;
    }
    if (!!evidence.remarks) {
      remarkValue = evidence.remarks;
    }
    const requestBody = {
      status: statusValue,
      evidences: [{
        id: evidence.internalId,
        remarks: remarkValue
      }]
    };
    this.updateEvidenceStatus(requestBody, decision, evidence);
  }

  private updateEvidenceStatus(requestBody: EvidenceStatusUpdate, buttonType: string, evidence: MilestoneEvidenceRow): void {
    const dialogData: DialogData = { dialogueTitle: 'Submitting decision', show: APICallStatus.Loading };
    const dialogMessage = this.dialogService.createDialog(DialogMessageComponent, dialogData);
    this.projectsService.updateEvidencesStatus(this.packageDetails().packageId, requestBody).subscribe({
      next: () => {
        dialogMessage.instance.show = APICallStatus.Success;
        dialogMessage.instance.additionalMessage = 'Your verdict has been received. The evidence decision has been updated.';
        this.packageService.emitPackageStatusUpdate(true);
        if (buttonType === 'Approve') {
          dialogMessage.instance.dialogueTitle = 'Evidence approved';
          dialogMessage.instance.iconStatus = 'icon-check';
        }
        else if (buttonType === 'Reject') {
          dialogMessage.instance.dialogueTitle = 'Evidence rejected';
          dialogMessage.instance.iconStatus = 'icon-cross';
        }
        evidence.status = buttonType === 'Approve' ? CustomerAcceptanceStatus.CustomerApproved : CustomerAcceptanceStatus.CustomerRejected;
        this.reloadHistoryStatus.next(true);
      },
      error: (err) => {
        dialogMessage.instance.show = APICallStatus.Error;
        let additionalMessage = '';
        if (err.status === HttpStatusCode.BadGateway || err.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          additionalMessage = '\n Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.';
        } else {
          additionalMessage = '\n Please follow the FAQ doc for further steps.';
        }
        dialogMessage.instance.statusMessage = 'Error when updating the evidence!' + additionalMessage;
        dialogMessage.instance.dialogueTitle = 'Failed to submit';
        dialogMessage.instance.additionalMessage = '';
        dialogMessage.instance.actionOn.next('FAQ');
        console.error(err);
      },
    });
  }

  // Index of current evidence in current page of parent list
  get pageIndex(): number {
    return this.currentSlideIndex() - this.offset();
  }

  onNext(): void {
    if (this.pageIndex >= this.evidences().length - (1 + this.preloadClosestPageThreshold) && this.totalRecords() > this.limit()) {
      this.page.set('next');
    }
  }

  onPrev(): void {
    if (this.pageIndex <= (0 + this.preloadClosestPageThreshold) && this.totalRecords() > this.limit()) {
      this.page.set('prev');
    }
  }

  close(): void {
    this.detailsService.close();
  }

  retrieveFileUrl(evidence: MilestoneEvidenceRow): Observable<FilePreview> {
    if (evidence.fileMIMEType === 'video/mp4'
    ) {
      return this.projectsService.getEvidenceFileSasUrl(evidence.internalId).pipe(
        map((evd) => {
          return evd.sasUrl;
        }),
        catchError(
          (error: HttpErrorResponse): Observable<any> => {
            return of(null); // or any other stream like of('') etc.
          }
        ),
        map(url => ({ name: evidence.name, mimeType: evidence.fileMIMEType, dataURI: url as string })),
        tap(filePreview => {
          this.dataURIMap.set(evidence.internalId, filePreview);
        }),
        shareReplay(1),
      );
    }
    else {
      return this.projectsService.getEvidenceFile(evidence.internalId).pipe(
        map((file) => {
          return window.URL.createObjectURL(file);
        }),
        catchError(
          (error: HttpErrorResponse): Observable<any> => {
            return of(null); // or any other stream like of('') etc.
          }
        ),
        map(url => ({ name: evidence.name, mimeType: evidence.fileMIMEType, dataURI: url as string })),
        tap(filePreview => {
          this.dataURIMap.set(evidence.internalId, filePreview);
        }),
        shareReplay(1),
      );
    }
  }

  retrieveEvidenceDetail(internalId: string): Observable<MilestoneEvidenceRow> {
    return this.projectsService.getEvidence(internalId).pipe(
      map(evidence => (evidence as MilestoneEvidenceRow))
    );
  }

  downLoadFile(id: string): void {
    const filePreview = this.dataURIMap.get(id);
    const link = document.createElement('a');
    link.href = filePreview.dataURI as string;
    link.download = filePreview.name;
    link.dispatchEvent(new MouseEvent('click'));
  }

  getRelatedEvidenceList(id: string): Observable<RelatedEvidence[]> {
    const existingObservable = this.relatedEvidencesObservableMap.get(id);
    if (existingObservable) return existingObservable;
    const newObservable = this.projectsService.getRelatedEvidenceList(id);
    this.relatedEvidencesObservableMap.set(id, newObservable);
    return newObservable;
  }
}
