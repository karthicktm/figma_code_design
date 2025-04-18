import { Table } from '@eds/vanilla';
import { ColumnsProps } from '@eds/vanilla/table/Table';
import { NullStringDatePipe } from 'src/app/shared/null-string-date.pipe';
import { ChecklistLineItemsShort, WorkplanSiteData } from '../../projects.interface';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { UserDetailsDialogComponent } from '../../details-dialog/user-details-dialog/user-details-dialog.component';

// Define the type for OpenLineItemLevelCallback
type Callback<T> = (rowData: T) => void;

export interface TableRowData {
  selected?: boolean,
  readonly indexOriginal?: number,
}

export default class TableUtils {
  /**
   * Overwrite EDS table feature functionality.
   * Assuming features are loaded/instantiated via `table.init()`
   * @param table instance to use
   * @param carrier that holds the references to totalRecords and offset as well as elements information state
   */
  static overwriteEDSTableFeatureTableInfo(table: Table, carrier: { totalRecords: number, offset: number, tableElements: any[] }): void {
    const tableInfoFeature = table.features?.[0];
    if (tableInfoFeature) {
      // Overwrite EDS table info feature "get totalNum" to reflect totalRecords from API based pagination.
      Object.defineProperty(tableInfoFeature, 'totalNum', {
        get: () => {
          return carrier.totalRecords;
        }
      });
      // Overwrite EDS table info feature "get showNum" to reflect the current page data received from API based pagination.
      Object.defineProperty(tableInfoFeature, 'showNum', {
        get: () => {
          if (carrier.offset !== undefined && carrier.tableElements !== undefined) {
            const start = carrier.offset;
            const end = start + carrier.tableElements.length;
            return `${start + 1} – ${end}`;
          } else {
            return 0;
          }
        }
      });
    }
    else {
      console.error('No table info feature loaded to customize');
    }
  }

  static sortUserOrderedColumns(target: ColumnsProps[], loadedTableSettings: ColumnsProps[]): ColumnsProps[] {
    // temporary array holds objects with position and sort-value
    const mapped = target?.map((prop: ColumnsProps, i) => {
      const value = loadedTableSettings?.findIndex(setting => setting?.key === prop.key);
      return { i, value };
    });

    // sorting the mapped array containing the reduced values
    mapped.sort((a, b) => {
      if (a.value > b.value) {
        return 1;
      }
      if (a.value < b.value) {
        return -1;
      }
      return 0;
    });
    return mapped.map((v) => target[v.i]);
  }

  /**
   * Format string to date in an EDS table cell
   * @param datePipe referenced date pipe object to transform the input
   * @param data input data in string
   * @param td table cell element to append the date
   * @param format optional, format of the date output
   */
  static formatDateCell(datePipe: NullStringDatePipe, data: string, td: HTMLTableCellElement, format?: string): void {
    if (!data) {
      // depict empty or null by dash
      td?.replaceChildren(document.createTextNode('--'));
      return
    };
    if (!format) {
      format = 'y-MM-dd';
    }
    let transformedDate = datePipe.transform(data, format);
    transformedDate = transformedDate ? transformedDate : '';
    if (td.firstChild) {
      td.replaceChild(document.createTextNode(transformedDate), td.firstChild);
    } else {
      td.appendChild(document.createTextNode(transformedDate));
    }
  }

  /**
   * Returns if the table has any row check marked.
   *
   * @param table to refer to
   */
  static isAnyRowCheckMarked(table: Table): boolean {
    return table?.selected?.length > 0 || false;
  }

  static addStatusFilterForEDSTable(table: Table, filterBy: string): void {
    if (!table) {
      return;
    }

    const attrKey = 'data-key';
    const statusHtmlElement: HTMLInputElement = table?.dom.table
      .querySelector(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])[data-key="status"]`)
    const input = statusHtmlElement?.firstChild;

    if (statusHtmlElement) {
      const filterInputElement = input as HTMLInputElement;
      filterInputElement.value = filterBy;
      const keyupEvent = new KeyboardEvent('change', {
        bubbles: true,
        cancelable: true,
        key: 'Enter'
      });
      filterInputElement.dispatchEvent(keyupEvent);
    }
  }

  static addDateFilterForEDSTable(table: Table): void {
    if (!table) {
      return;
    }

    const attrKey = 'data-key';
    table?.dom.table
      .querySelectorAll(`thead>tr.filters>td[${attrKey}]:not([${attrKey}=""])`)
      .forEach(cell => {
        const input = cell?.firstChild;
        const filterInputMarkerClass = 'filter-marker';

        if (input && !cell.classList.contains(filterInputMarkerClass)) {
          const attribute = cell.getAttribute(attrKey);

          if (attribute.includes('date') || attribute.includes('Date')) {
            const newInputElement = input as HTMLInputElement;
            newInputElement.type = 'date';
            newInputElement.addEventListener('focus', (event) => {
              (event.target as HTMLInputElement)?.showPicker();
            });
            newInputElement.addEventListener(
              'change',
              (event: KeyboardEvent) => {
                newInputElement.dispatchEvent(new KeyboardEvent('keyup', {
                  code: 'Enter',
                  key: 'Enter',
                  charCode: 13,
                  keyCode: 13,
                  view: window,
                  bubbles: true
                }));
              },
              false
            );
          }
        }
      });
  }

  static formatCellContentWithoutCellDataNA = (td: HTMLTableCellElement, cellData: string): void => {
    if (!cellData) {
      td.replaceChildren(document.createTextNode('NA'));
    }
  };

  static formatCellContentWithoutCellDataDoubleDash = (td: HTMLTableCellElement, cellData: string): void => {
    if (!cellData) {
      td.replaceChildren(document.createTextNode('--'));
    }
  };

  // function called when icon  line item text with hyperlink is needed
  static replaceLineItemIdCellContentWithDetails = (lineItemIdClassName: string,
    rowData: ChecklistLineItemsShort,
    lineItemIdCell: Element,
    infoClickCallback: Callback<ChecklistLineItemsShort>,
    detailClickCallback: Callback<ChecklistLineItemsShort>,
    eventAbortController: AbortController): void => {
    const anchorElement = document.createElement('a');
    anchorElement.classList.add(lineItemIdClassName);
    anchorElement.addEventListener('click', (event) => {
      detailClickCallback(rowData);
    }, { signal: eventAbortController.signal } as AddEventListenerOptions);
    anchorElement.appendChild(document.createTextNode(lineItemIdCell.textContent));

    // create a info icon for information details of line item
    const infoElement = TableUtils.createInfoIconElement<ChecklistLineItemsShort>(rowData, infoClickCallback, eventAbortController);
    lineItemIdCell.replaceChildren(infoElement);

    // append anchor element for evidence details navigation (of line item)
    lineItemIdCell.appendChild(anchorElement);
  }

  // utility function common for Info icon element creation
  static createInfoIconElement<T>(data: T,
    clickCallback: Callback<T>,
    eventAbortController: AbortController): Element {
    const infoElement = document.createElement('i');
    infoElement.classList.add('icon', 'icon-info', 'pointer', 'mr-sm', 'ml-sm');
    infoElement.style.cursor = 'pointer';
    infoElement.addEventListener('click', (event) => {
      clickCallback(data);
    }, { signal: eventAbortController.signal } as AddEventListenerOptions);
    return infoElement;
  }

  // function called when icon  line item text is needed
  static replaceLineItemIdCellContentWithInfoIcon = (rowData: ChecklistLineItemsShort,
    lineItemIdCell: Element,
    infoClickCallback: Callback<ChecklistLineItemsShort>,
    eventAbortController: AbortController): void => {
    // create a info icon for information details of line item
    const infoElement = TableUtils.createInfoIconElement<ChecklistLineItemsShort>(rowData, infoClickCallback, eventAbortController);
    lineItemIdCell.insertBefore(infoElement, lineItemIdCell.firstChild);
  }


  static replacePackageNameCellWithLink = (lineItemPkgClassName: string, rowData: ChecklistLineItemsShort, lineItemPkgNameCell: Element, projectId: string, eventAbortController: AbortController): void => {
    const packageId = rowData.packageId;
    const pkgRefLink = `/projects/${projectId}/acceptance-packages/${packageId}`;

    const anchorElement = document.createElement('a');
    anchorElement.classList.add(lineItemPkgClassName);
    anchorElement.addEventListener('click', (event) => {
      anchorElement.setAttribute('href', pkgRefLink);
      anchorElement.setAttribute('target', '_blank');
      anchorElement.setAttribute('rel', 'noopener noreferrer');
    }, { signal: eventAbortController.signal } as AddEventListenerOptions);

    anchorElement.appendChild(document.createTextNode(lineItemPkgNameCell.textContent));
    lineItemPkgNameCell.replaceChildren(anchorElement);
  }

  // function called when info icon of user details is needed
  static replaceUserIdCellContentWithInfoIcon = (userId: string,
    userIdCell: HTMLTableCellElement,
    dialogService: DialogService,
    eventAbortController: AbortController): void => {
    if (userId) {
      // create an info icon for user details
      const infoClickCallback = (userId: string): void => {
        const dialogRef = dialogService.createDialog(UserDetailsDialogComponent, userId);
      }
      const infoElement = TableUtils.createInfoIconElement<string>(userId, infoClickCallback, eventAbortController);
      userIdCell.insertBefore(infoElement, userIdCell.firstChild);
    } else {
      TableUtils.formatCellContentWithoutCellDataDoubleDash(userIdCell, userId);
    }
  }


  static insertIconAndTextWithDialog = (rowData: WorkplanSiteData,
    eventAbortController: AbortController,
    clickCallback: Callback<WorkplanSiteData>,
    number: number,
    toReplaceCellName: string,
    tr: HTMLTableRowElement): void => {

    const infoElement = TableUtils.createInfoIconElement<WorkplanSiteData>(rowData, clickCallback, eventAbortController);

    const numberText = document.createTextNode(number.toString());
    const container = document.createElement('span');
    container.append(infoElement, numberText);

    const td = tr.querySelector(toReplaceCellName)
    td.replaceChildren(container);
  }

}
