import { Table } from '@eds/vanilla';
import { NotificationService } from '../portal/services/notification.service';

/** Reset value to specific offset  **/
export const resetOffsetValue = 0;

export const updateNoDataRowInTable = (tableRef: Table, message: string, reloadCallback?: () => void): void => {
  const noDataTr = tableRef.dom.table.querySelector('.no-data-row');
  const noDataTd = noDataTr?.firstElementChild;
  if (noDataTd) {
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message');
    const messageP = document.createElement('p');
    messageP.appendChild(document.createTextNode(message));
    if (reloadCallback) {
      const reloadButton = document.createElement('button');
      reloadButton.classList.add('btn');
      reloadButton.appendChild(document.createTextNode('Reload'));
      reloadButton.addEventListener('click', () => {
        reloadCallback();
      });
      messageDiv.append(messageP, reloadButton);
    } else {
      messageDiv.append(messageP);
    }
    noDataTd.replaceChildren(messageDiv);
  }
}

export const addSearchDropDownOptions = (inputElement: HTMLInputElement, attribute: string, options: string[], tableName?: string): void => {
  if(!inputElement || !attribute || !options || !Array.isArray(options) || options.length === 0) {
    return;
  }

  // to fix issue related to edge browser where saved info hinders the rendering of options
  inputElement.autocomplete = 'off'
  
  const datalistName = (tableName ? tableName + '-' : '') + `table-filter-input-datalist-${attribute}`
  inputElement.type = 'search';
  inputElement.setAttribute('list', datalistName);

  const dataList = document.createElement('datalist');
  dataList.setAttribute('id', datalistName);

  options.forEach(opt => {
    const option = document.createElement('option');
    option.setAttribute('value', opt);
    dataList.appendChild(option);
  });

  inputElement.parentElement.appendChild(dataList);
  inputElement.addEventListener('keyup', (event) => {
    const currVal = inputElement.value;
    let found = false;

    for (let i = 0; i < options.length; i++) {
      if (options[i].toLowerCase().includes(currVal.toLowerCase())) {
        found = true;
        break;
      }
    }

    if (!found) {
      inputElement.value = '';
    }
  });
}

/**
 * Utility function to validate length of filter text in table or any similar text input field,
 * where limits on length are set in filterConfig object with minLength and maxLength fields
 * @param inputValue : Text value of filter text input
 * @param filterConfig : Filter config of the attribute key, pass blank object - {} to apply default for minLength and maxLength config items
 * @param notificationService : NotificationService reference to show message
 * @returns : True if input text length is valid, else False
 */
export const checkValueLength = (inputValue: string, filterConfig: Object,
  notificationService: NotificationService): boolean => {
  let result = true;
  const maxLength: number = filterConfig['maxLength'] || 255; // Most common case across table fields in DB
  const minLength: number = filterConfig['minLength'] || 0; // Most of DB fields are varchar so minimum is 0

  if (inputValue.length < minLength) {
    notificationService.showNotification({
      title: 'Invalid text input',
      description: 'A valid text can not have length less than ' + minLength
    });

    result = false;
  }

  if (inputValue.length > maxLength) {
    notificationService.showNotification({
      title: 'Invalid search input',
      description: 'A valid text can not have length more than ' + maxLength
    });

    result = false;
  }

  return result;
}

