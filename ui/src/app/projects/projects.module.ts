import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragulaModule } from 'ng2-dragula';
import { HelpModule } from '../help/help.module';
import { PortalModule } from '../portal/portal.module';
import { FormatBytesPipe } from '../shared/format-bytes.pipe';
import { SharedModule } from './../shared/shared.module';
import { AcceptanceProjectListComponent } from './acceptance-project-list/acceptance-project-list.component';
import { AddNewDocumentDialogComponent } from './details-dialog/add-new-document-dialog/add-new-document-dialog.component';
import { CustomerDetailsDialogComponent } from './details-dialog/customer-details-dialog/customer-details-dialog.component';
import { DownloadPackageDialogComponent } from './details-dialog/download-package-dialog/download-package-dialog.component';
import { LineItemInfoDialogComponent } from './details-dialog/line-item-info-dialog/line-item-info-dialog.component';
import { NetworkElementInfoDialogComponent } from './details-dialog/network-element-info-dialog/network-element-info-dialog.component';
import { ProjectDetailsDialogComponent } from './details-dialog/project-details-dialog/project-details-dialog.component';
import { ReferenceEvidenceDialogComponent } from './details-dialog/reference-evidence-dialog/reference-evidence-dialog.component';
import { SubmitPackageDialogComponent } from './details-dialog/submit-package-dialog/submit-package-dialog.component';
import { SubmitPackageVerdictDialogComponent } from './details-dialog/submit-package-verdict-dialog/submit-package-verdict-dialog.component';
import { WorkItemInfoDialogComponent } from './details-dialog/work-item-info-dialog/work-item-info-dialog.component';
import { ObserveVisibilityDirective } from './observe-visibility.directive';
import { CommentSectionComponent } from './project-details/comment-section/comment-section.component';
import { FilterPillsComponent } from './project-details/comment-section/filter-pills/filter-pills.component';
import { LineItemListComponent } from './project-structure/line-item-list/line-item-list.component';
import { NodeInfoDialogComponent } from './project-structure/node-info-dialog/node-info-dialog.component';
import { ProjectLineItemDetailsComponent } from './project-structure/project-line-item-details/project-line-item-details.component';
import { SiteDetailsComponent } from './project-structure/site-details/site-details.component';
import { SiteHierarchyComponent } from './project-structure/site-hierarchy/site-hierarchy.component';
import { SiteNavigationTreeComponent } from './project-structure/site-navigation-tree/site-navigation-tree.component';
import { AcceptancePackageDetailsComponent } from './project/acceptance-package-details/acceptance-package-details.component';
import { AddCommentDialogComponent } from './project/acceptance-package-details/add-comment-dialog/add-comment-dialog.component';
import { AttachedDocumentsComponent } from './project/acceptance-package-details/attached-documents/attached-documents.component';
import { DeleteDocumentDialogComponent } from './project/acceptance-package-details/attached-documents/delete-document-dialog/delete-document-dialog.component';
import { PackageEvidenceDetailsComponent } from './project/acceptance-package-details/attached-documents/package-evidence-details/package-evidence-details.component';
import { SourceReportDialogComponent } from './project/acceptance-package-details/attached-documents/source-report-dialog/source-report-dialog.component';
import { SourceSRSReportDialogComponent } from './project/acceptance-package-details/attached-documents/source-srs-report-dialog/source-srs-report-dialog.component';
import { CommentHistoryComponent } from './project/acceptance-package-details/comment-history/comment-history.component';
import { EvidenceHistoryComponent } from './project/acceptance-package-details/evidence-history/evidence-history.component';
import { AcceptanceDecisionDialogComponent } from './project/acceptance-package-details/package-components/acceptance-decision-dialog/acceptance-decision-dialog.component';
import { EvidenceThumbnailComponent } from './project/acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnail/evidence-thumbnail.component';
import { EvidenceThumbnailsComponent } from './project/acceptance-package-details/package-components/evidence-thumbnails/evidence-thumbnails.component';
import { EvidencesComponent } from './project/acceptance-package-details/package-components/evidences/evidences.component';
import { LineItemDetailsComponent } from './project/acceptance-package-details/package-components/line-item-details/line-item-details.component';
import { StatusFilterComponent } from './project/acceptance-package-details/package-components/line-item-details/status-filter/status-filter.component';
import { LineItemComponent } from './project/acceptance-package-details/package-components/line-item/line-item.component';
import { LineitemEvidenceDetailsComponent } from './project/acceptance-package-details/package-components/lineitem-evidence-details/lineitem-evidence-details.component';
import { PackageComponentsComponent } from './project/acceptance-package-details/package-components/package-components.component';
import { TaxonomyTreeComponent } from './project/acceptance-package-details/package-components/taxonomy-tree/taxonomy-tree.component';
import { PackageUsersComponent } from './project/acceptance-package-details/users-details/package-users/package-users.component';
import { UserGroupInfoDialogComponent } from './project/acceptance-package-details/users-details/user-group-info-dialog/user-group-info-dialog.component';
import { UsersDetailsComponent } from './project/acceptance-package-details/users-details/users-details.component';
import { AcceptancePackageFormStep1Component } from './project/acceptance-package-new/acceptance-package-form-step1/acceptance-package-form-step1.component';
import { PackageDetailsFormComponent } from './project/acceptance-package-new/acceptance-package-form-step1/package-details-form/package-details-form.component';
import { UserSectionFormComponent } from './project/acceptance-package-new/acceptance-package-form-step1/user-section-form/user-section-form.component';
import { AcceptancePackageFormStep2Component } from './project/acceptance-package-new/acceptance-package-form-step2/acceptance-package-form-step2.component';
import { LineItemDataComponent } from './project/acceptance-package-new/acceptance-package-form-step2/line-item-data/line-item-data.component';
import { NavigationTreeComponent } from './project/acceptance-package-new/acceptance-package-form-step2/navigation-tree/navigation-tree.component';
import { AcceptancePackageFormStep3Component } from './project/acceptance-package-new/acceptance-package-form-step3/acceptance-package-form-step3.component';
import { AcceptancePackageNewComponent } from './project/acceptance-package-new/acceptance-package-new.component';
import { AcceptancePackageDownloadDropDownComponent } from './project/acceptance-package-download-drop-down/acceptance-package-download-drop-down.component';
import { MaximizeScreenComponent } from './project/rework-acceptance-package/maximize-screen/maximize-screen.component';
import { AbandonAcceptancePackageDialogComponent } from './project/acceptance-packages/abandon-acceptance-package-dialog/abandon-acceptance-package-dialog.component';
import { AcceptancePackagesComponent } from './project/acceptance-packages/acceptance-packages.component';
import { EditAcceptancePackageComponent } from './project/edit-acceptance-package/edit-acceptance-package.component';
import { ProjectMenuComponent } from './project/project-menu/project-menu.component';
import { RelatedEvidencesComponent } from './project/related-evidences/related-evidences.component';
import { SubmitVerdictDialogComponent } from './project/submit-verdict-dialog/submit-verdict-dialog.component';
import { ProjectsRoutingModule } from './projects-routing.module';
import { UploadReferencedEvidenceDialogComponent } from './upload-referenced-evidence-dialog/upload-referenced-evidence-dialog.component';
import { SourceSdeReportWizardComponent } from './project/acceptance-package-details/attached-documents/source-sde-report-wizard/source-sde-report-wizard.component';
import { SourceSrsReportComponent } from './project/acceptance-package-details/attached-documents/source-srs-report/source-srs-report.component';
import { SnagReportDialogComponent } from './details-dialog/snag-report-dialog/snag-report-dialog.component';
import { ReminderConfigurationDialogComponent } from './details-dialog/reminder-configuration-dialog/reminder-configuration-dialog.component';
import { TreeComponent } from './project/acceptance-package-new/acceptance-package-form-step2/navigation-tree/tree/tree.component';
import { AcceptancePackageFormStep5Component } from './project/acceptance-package-new/acceptance-package-form-step5/acceptance-package-form-step5.component';
import { FormDataService } from './project/acceptance-package-new/form-data.service';
import { LineItemInfoReworkDialogComponent } from './project/rework-acceptance-package/line-item-info-rework-dialog/line-item-info-rework-dialog.component';
import { BulkDecisionDialogComponent } from './project/acceptance-package-details/package-components/line-item-details/bulk-decision-dialog/bulk-decision-dialog.component';
import { EmailNotificationConfigurationDialogComponent } from './details-dialog/email-notification-configuration-dialog/email-notification-configuration-dialog.component';
import { ReworkAcceptancePackageComponent } from './project/rework-acceptance-package/rework-acceptance-package.component';
import { EvidencesCarouselComponent as PackageEvidencesCarouselComponent } from './project/acceptance-package-details/attached-documents/evidences-carousel/evidences-carousel.component';
import { EvidencesCarouselComponent } from './project/acceptance-package-details/package-components/lineitem-evidence-details/evidences-carousel/evidences-carousel.component';
import { ReworkAcceptancePackageStep1Component } from './project/rework-acceptance-package/rework-acceptance-package-step1/rework-acceptance-package-step1.component';
import { ReworkAcceptancePackageStep2Component } from './project/rework-acceptance-package/rework-acceptance-package-step2/rework-acceptance-package-step2.component';
import { RaEvidenceDialogComponent } from './project/rework-acceptance-package/ra-evidence-dialog/ra-evidence-dialog.component';
import { ReworkAcceptancePackageStep3Component } from './project/rework-acceptance-package/rework-acceptance-package-step3/rework-acceptance-package-step3.component';
import { ReworkAcceptancePackageStep4Component } from './project/rework-acceptance-package/rework-acceptance-package-step4/rework-acceptance-package-step4.component';
import { ProjectReportDownloadComponent } from './project/project-menu/project-report-download/project-report-download.component';
import { ValidationResDialogComponent } from './project/acceptance-package-details/validation-res-dialog/validation-res-dialog.component';
import { CreateSubmitDialogMessageComponent } from './project/acceptance-package-new/create-submit-dialog-message/create-submit-dialog-message.component';
import { AllLineItemsComponent } from './project-structure/all-line-items/all-line-items.component';
import { AcceptancePackageFormMilestonesComponent } from './project/acceptance-package-new/acceptance-package-form-milestones/acceptance-package-form-milestones.component';
import { CertificateDocumentUploadDialogComponent } from './project/certificates/certificate-document-upload-dialog/certificate-document-upload-dialog.component';
import { MilestoneEvidencesComponent } from './project/acceptance-package-details/package-components/milestone-evidences/milestone-evidences.component';
import { AcceptancePackageFormMilestoneComponentsComponent } from './project/acceptance-package-new/acceptance-package-form-milestone-components/acceptance-package-form-milestone-components.component';
import { PackageTimelineComponent } from './project/acceptance-package-details/package-timeline/package-timeline.component';
import { EvidenceRemarksComponent } from './project-structure/evidence-remarks/evidence-remarks.component';
import { AcceptancePackageFormSitesComponent } from './project/acceptance-package-new/acceptance-package-form-sites/acceptance-package-form-sites.component';
import { AcceptancePackageFormWorkplansComponent } from './project/acceptance-package-new/acceptance-package-form-workplans/acceptance-package-form-workplans.component';
import { FlowConfigurationComponent } from './details-dialog/reminder-configuration-dialog/flow-configuration/flow-configuration.component';
import { PackageConfigurationComponent } from './details-dialog/reminder-configuration-dialog/package-configuration/package-configuration.component';

@NgModule({
  declarations: [
    AcceptanceProjectListComponent,
    CommentSectionComponent,
    SubmitVerdictDialogComponent,
    AcceptancePackagesComponent,
    AcceptancePackageDetailsComponent,
    UsersDetailsComponent,
    PackageComponentsComponent,
    PackageUsersComponent,
    AcceptanceDecisionDialogComponent,
    FilterPillsComponent,
    ProjectDetailsDialogComponent,
    CustomerDetailsDialogComponent,
    LineItemComponent,
    AttachedDocumentsComponent,
    NetworkElementInfoDialogComponent,
    WorkItemInfoDialogComponent,
    SubmitPackageDialogComponent,
    AddNewDocumentDialogComponent,
    EvidencesComponent,
    LineItemDetailsComponent,
    SubmitPackageVerdictDialogComponent,
    LineItemDetailsComponent,
    LineitemEvidenceDetailsComponent,
    PackageEvidenceDetailsComponent,
    ProjectLineItemDetailsComponent,
    DownloadPackageDialogComponent,
    ReferenceEvidenceDialogComponent,
    DeleteDocumentDialogComponent,
    LineItemInfoDialogComponent,
    AddCommentDialogComponent,
    StatusFilterComponent,
    UserGroupInfoDialogComponent,
    TaxonomyTreeComponent,
    SourceReportDialogComponent,
    SourceSRSReportDialogComponent,
    ProjectMenuComponent,
    EvidenceThumbnailsComponent,
    EvidenceThumbnailComponent,
    ObserveVisibilityDirective,
    AcceptancePackageDownloadDropDownComponent,
    LineItemListComponent,
    SiteHierarchyComponent,
    SiteNavigationTreeComponent,
    SiteDetailsComponent,
    UploadReferencedEvidenceDialogComponent,
    AcceptancePackageNewComponent,
    AcceptancePackageFormStep1Component,
    PackageDetailsFormComponent,
    AcceptancePackageFormStep2Component,
    NavigationTreeComponent,
    LineItemDataComponent,
    UserSectionFormComponent,
    AcceptancePackageFormStep3Component,
    NodeInfoDialogComponent,
    UserSectionFormComponent,
    EditAcceptancePackageComponent,
    AbandonAcceptancePackageDialogComponent,
    MaximizeScreenComponent,
    SourceSdeReportWizardComponent,
    SourceSrsReportComponent,
    SnagReportDialogComponent,
    ReminderConfigurationDialogComponent,
    TreeComponent,
    AcceptancePackageFormStep5Component,
    LineItemInfoReworkDialogComponent,
    EmailNotificationConfigurationDialogComponent,
    PackageEvidencesCarouselComponent,
    EvidencesCarouselComponent,
    BulkDecisionDialogComponent,
    ReworkAcceptancePackageComponent,
    ReworkAcceptancePackageStep1Component,
    ReworkAcceptancePackageStep2Component,
    RaEvidenceDialogComponent,
    ReworkAcceptancePackageStep3Component,
    ReworkAcceptancePackageStep4Component,
    ProjectReportDownloadComponent,
    ValidationResDialogComponent,
    CreateSubmitDialogMessageComponent,
    AllLineItemsComponent,
    CertificateDocumentUploadDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProjectsRoutingModule,
    SharedModule,
    FormatBytesPipe,
    PortalModule,
    ReactiveFormsModule,
    DragulaModule,
    OverlayModule,
    HelpModule,
    AcceptancePackageFormMilestonesComponent,
    MilestoneEvidencesComponent,
    AcceptancePackageFormMilestoneComponentsComponent,
    CommentHistoryComponent,
    EvidenceHistoryComponent,
    RelatedEvidencesComponent,
    PackageTimelineComponent,
    EvidenceRemarksComponent,
    AcceptancePackageFormSitesComponent,
    AcceptancePackageFormWorkplansComponent,
    PackageConfigurationComponent,
    FlowConfigurationComponent,
  ],
  providers: [
    FormDataService
  ]
})
export class ProjectsModule { }
