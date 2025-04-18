/**
 * Core
 */
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
/**
 * extras
 */
// import 'prismjs/prism';
// import 'prismjs/components/prism-bash';
// import 'prismjs/components/prism-json';
// import 'prismjs/components/prism-less';
// import 'prismjs/components/prism-typescript';
/**
 * Directives
 */
import { ThemeSwitchDirective } from '../portal/actions/theme-switch.directive';
/**
 * Components
 */
import { ThemeSwitchComponent } from '../portal/assets/theme-switch/theme-switch.component';
import { SelectWithInputComponent } from './select-with-input/select-with-input.component';
import { SelectComponent } from './select/select.component';
import { IconHFileComponent } from './icon-h-file/icon-h-file.component';
import { SelectWithInputAddComponent } from './select-with-input-add/select-with-input-add.component';
import { GaugeComponent } from './gauge/gauge.component';
import { AccordionDirective } from './accordion.directive';
import { AutofocusDirective } from './autofocus.directive';
import { NullStringDatePipe } from './null-string-date.pipe';
import { MapComponent } from './map/map.component';
import { StringLengthTruncatePipe } from './string-length-truncate.pipe';
import { IconExcelFileComponent } from './icon-excel-file/icon-excel-file.component';
import { DialogMessageComponent } from './dialog-message/dialog-message.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SafePipe } from './safe.pipe';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { StackedBarChartComponent } from './stacked-bar-chart/stacked-bar-chart.component';
import { FilePreviewWrapperComponent } from './file-preview-wrapper/file-preview-wrapper.component';
import { ImageFilePreviewComponent } from './file-preview-wrapper/image-file-preview/image-file-preview.component';
import { ObjectFilePreviewComponent } from './file-preview-wrapper/object-file-preview/object-file-preview.component';
import { FileToolbarComponent } from './file-preview-wrapper/file-toolbar/file-toolbar.component';
import { VideoFilePreviewComponent } from './file-preview-wrapper/video-file-preview/video-file-preview.component';
import { VideoFileStreamingPreviewComponent } from './file-preview-wrapper/video-file-streaming-preview/video-file-streaming-preview.component';
import { SelectMultiInputComponent } from './select-multi-input/select-multi-input.component';
import { SubMenuItemComponent } from './sub-menu-item/sub-menu-item.component';
import { BackButtonDirective } from './back-button.directive';
import { HelpModule } from '../help/help.module';
import { MarkableDirective } from './file-preview-wrapper/image-file-preview/markable.directive';
import { MarkerDescriptionDialogComponent } from './file-preview-wrapper/marker-description-dialog/marker-description-dialog.component';
import { SearchFieldComponent } from '../portal/assets/search-field/search-field.component';
import { SearchResultsComponent } from '../portal/assets/search-results/search-results.component';
import { TableServerSidePaginationComponent } from './table-server-side-pagination/table-server-side-pagination.component';
/**
 * Pipes
 */

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CdkTreeModule,
    RouterModule,
    HelpModule,
    TableServerSidePaginationComponent,
  ],
  declarations: [
    ThemeSwitchDirective,
    ThemeSwitchComponent,
    SelectComponent,
    SelectWithInputComponent,
    IconHFileComponent,
    SelectWithInputAddComponent,
    GaugeComponent,
    AccordionDirective,
    AutofocusDirective,
    NullStringDatePipe,
    MapComponent,
    StringLengthTruncatePipe,
    IconExcelFileComponent,
    DialogMessageComponent,
    PaginationComponent,
    SafePipe,
    BarChartComponent,
    StackedBarChartComponent,
    FilePreviewWrapperComponent,
    ImageFilePreviewComponent,
    ObjectFilePreviewComponent,
    FileToolbarComponent,
    VideoFilePreviewComponent,
    VideoFileStreamingPreviewComponent,
    SelectMultiInputComponent,
    SubMenuItemComponent,
    BackButtonDirective,
    MarkableDirective,
    MarkerDescriptionDialogComponent,
    SearchFieldComponent,
    SearchResultsComponent,
  ],
  exports: [
    CommonModule,
    ThemeSwitchDirective,
    ThemeSwitchComponent,
    SelectComponent,
    SelectWithInputComponent,
    IconHFileComponent,
    SelectWithInputAddComponent,
    GaugeComponent,
    AccordionDirective,
    AutofocusDirective,
    NullStringDatePipe,
    MapComponent,
    StringLengthTruncatePipe,
    IconExcelFileComponent,
    PaginationComponent,
    SafePipe,
    BarChartComponent,
    StackedBarChartComponent,
    FilePreviewWrapperComponent,
    ImageFilePreviewComponent,
    ObjectFilePreviewComponent,
    FileToolbarComponent,
    VideoFilePreviewComponent,
    SelectMultiInputComponent,
    SubMenuItemComponent,
    BackButtonDirective,
    SearchFieldComponent,
    SearchResultsComponent,
    TableServerSidePaginationComponent,
  ],
  providers: [
    NullStringDatePipe,
    StringLengthTruncatePipe
  ]
})
export class SharedModule { }
