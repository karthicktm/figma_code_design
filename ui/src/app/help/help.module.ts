import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpDocumentLoaderDirective } from './help-document-loader.directive';

@NgModule({
  declarations: [
    HelpDocumentLoaderDirective,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    HelpDocumentLoaderDirective,
  ]
})
export class HelpModule{ }