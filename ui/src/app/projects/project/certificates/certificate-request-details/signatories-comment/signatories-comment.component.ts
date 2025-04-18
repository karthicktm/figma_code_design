import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, input, signal } from '@angular/core';
import { CertificateRequestDetails, CertificateRequestDetailsSignatory } from 'src/app/projects/projects.interface';
import { SharedModule } from 'src/app/shared/shared.module';
import { Table } from '@eds/vanilla';
import CertificateUtils from '../../certificate-utilities';

@Component({
  selector: 'app-signatories-comment',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './signatories-comment.component.html',
  styleUrl: './signatories-comment.component.less'
})
export class SignatoriesCommentComponent implements OnInit, AfterViewInit, OnDestroy {
  // table reference
  @ViewChild('table') readonly tableElementRef: ElementRef<HTMLElement>

  // table data
  private data: CertificateRequestDetailsSignatory[];
  private scripts: Scripts[] = [];

  requestDetails = input.required<CertificateRequestDetails>();

  ericssonSignatories = signal<CertificateRequestDetailsSignatory[]>([]);
  customerSignatories = signal<CertificateRequestDetailsSignatory[]>([]);

  ngOnInit(): void {
    const eSignatories = this.requestDetails().ericssonSignatories.map(obj => ({ ...obj, type: 'Ericsson' })).sort((s1, s2) => s1.level - s2.level);
    this.ericssonSignatories.set(eSignatories);
    const cSignatories = this.requestDetails().customerSignatories.map(obj => ({ ...obj, type: 'Customer' })).sort((s1, s2) => s1.level - s2.level);
    this.customerSignatories.set(cSignatories);

    // merge both signatories to fill in data table
    this.data = [...eSignatories, ...cSignatories];;
  }

  ngAfterViewInit(): void {
    const columnsProperties = [
      {
        key: 'username',
        title: 'Signatory name',
      },
      {
        key: 'type',
        title: 'Signatory type',
      },
      {
        key: 'level',
        title: 'Signatory sequence',
      },
      {
        key: 'status',
        title: 'Signing status',
        onCreatedCell: (td: HTMLTableCellElement, cellData: string): void => {
          const kdb = CertificateUtils.getSignatoryStatusTag(cellData, { big: true });
          td.replaceChildren(kdb);
        },
      },
    ];

    const tableHeightStyleProp = 'calc(100vh - 480px)';
    const groupUserTableDOM = this.tableElementRef.nativeElement as HTMLElement;
    if (groupUserTableDOM) {
      const table = new Table(groupUserTableDOM, {
        data: this.data,
        columns: columnsProperties,
        height: tableHeightStyleProp,
        scroll: true,
        actions: false
      });
      table.init();
      this.scripts.push(table);
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }
}
