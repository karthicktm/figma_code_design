import { CustomerAcceptanceStatus, CustomerMultiLevelActionStatus, Evidence } from '../projects.interface';

export default class AcceptancePackageUtils {
  /**
   * Get tag element with status dependent color and text.
   * @param status to translate
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case CustomerAcceptanceStatus.CustomerNew:
      case CustomerAcceptanceStatus.CustomerRevision:
      case CustomerAcceptanceStatus.Ready:
      case CustomerAcceptanceStatus.AcceptanceDocumentInitiate:
      case CustomerAcceptanceStatus.AcceptanceDocumentReady:
        return 'blue';
      case CustomerAcceptanceStatus.CustomerNewPendingApproval:
        return 'purple';
      case CustomerAcceptanceStatus.CustomerRejected:
      case CustomerAcceptanceStatus.CustomerRejectedNoAction:
      case CustomerAcceptanceStatus.AcceptanceDocumentSendFailed:
        return 'red';
      case CustomerAcceptanceStatus.CustomerApproved:
      case CustomerAcceptanceStatus.DeemedApproved:
      case CustomerAcceptanceStatus.AcceptanceDocumentSent:
        return 'green';
      case CustomerAcceptanceStatus.CustomerReworked:
        return 'orange';
      case CustomerAcceptanceStatus.CustomerReworkedPendingApproval:
        return 'yellow';
      default:
        return '';
    }
  }

  /**
   * Get tag element with status dependent color and text.
   * @param status to translate
   */
  static getStatusTag(status: string, options?: { big: boolean }): HTMLElement {
    const kdb = document.createElement('kbd');
    kdb.classList.add(
      'tag',
    );
    if (options?.big === true) {
      kdb.classList.add(
        'big',
      );
    }
    kdb.appendChild(document.createTextNode(AcceptancePackageUtils.getStatus(status)));
    switch (status) {
      case CustomerAcceptanceStatus.CustomerNew:
      case CustomerAcceptanceStatus.CustomerRevision:
      case CustomerAcceptanceStatus.Ready:
      case CustomerAcceptanceStatus.AcceptanceDocumentInitiate:
      case CustomerAcceptanceStatus.AcceptanceDocumentReady:
        kdb.classList.add(
          'blue',
        );
        return kdb;
      case CustomerAcceptanceStatus.CustomerNewPendingApproval:
        kdb.classList.add(
          'purple',
        );
        return kdb;
      case CustomerAcceptanceStatus.CustomerRejectedNoAction:
      case CustomerAcceptanceStatus.CustomerRejected:
      case CustomerAcceptanceStatus.AcceptanceDocumentSendFailed:
        kdb.classList.add(
          'red',
        );
        return kdb;
      case CustomerAcceptanceStatus.CustomerApproved:
      case CustomerAcceptanceStatus.DeemedApproved:
      case CustomerAcceptanceStatus.AcceptanceDocumentSent:
        kdb.classList.add(
          'green',
        );
        return kdb;
      case CustomerAcceptanceStatus.CustomerReworked:
        kdb.classList.add(
          'orange',
        );
        return kdb;
      case CustomerAcceptanceStatus.CustomerReworkedPendingApproval:
        kdb.classList.add(
          'yellow',
        );
        return kdb;
      case CustomerAcceptanceStatus.CustomerAcceptanceNotRequired:
      case CustomerAcceptanceStatus.Draft:
      case CustomerAcceptanceStatus.Success:
      case CustomerAcceptanceStatus.Failed:
      case CustomerAcceptanceStatus.Abandoned:
        return kdb;
      default:
        return kdb;
    }
  }


  /**
   * Get tag element with action status for multi - level approver
   * @param status to translate
   */
  static getMultiActionStatusTag(status: string, options?: { big: boolean }): HTMLElement {
    const kdb = document.createElement('kbd');
    kdb.classList.add(
      'tag',
    );
    if (options?.big === true) {
      kdb.classList.add(
        'big',
      );
    }

    kdb.appendChild(document.createTextNode(AcceptancePackageUtils.getMultiActionStatus(status)));
    kdb.classList.add(AcceptancePackageUtils.getMultiStatusColor(status));

    return kdb;
  }

  /**
 * Get color class for multi level field - myLevelStatus
 * @param status to translate
 */
  static getMultiStatusColor(status: string): string {
    let className = 'grey';

    switch (status) {
      case CustomerMultiLevelActionStatus.CustomerNewPendingApproval:
        className = 'purple';
        break;
      case CustomerMultiLevelActionStatus.CustomerRejectedNoAction:
      case CustomerMultiLevelActionStatus.CustomerRejected:
        className = 'red';
        break;
      case CustomerMultiLevelActionStatus.CustomerApproved:
      case CustomerMultiLevelActionStatus.DeemedApproved:
        className = 'green';
        break;
      case CustomerMultiLevelActionStatus.CustomerReworkedPendingApproval:
        className = 'yellow';
        break;
      case CustomerMultiLevelActionStatus.CustomerAwaiting:
        className = 'blue';
        break;
      case CustomerMultiLevelActionStatus.CustomerAcceptanceNotRequired:
      case CustomerMultiLevelActionStatus.CustomerNoActionRequired:
      case CustomerMultiLevelActionStatus.NotApplicable:
        className = 'grey';
        break;
      default:
        className = 'grey';
    }

    return className;
  }

  /**
   * Get status from enum
   * @param status input as a string
   */
  static getStatus(status: string): string {
    switch (status) {
      case CustomerAcceptanceStatus.CustomerNew:
      case CustomerAcceptanceStatus.CustomerRevision:
      case 'CustomerNew':
      case 'CustomerRevision':
        return 'New';
      case CustomerAcceptanceStatus.Draft:
      case 'Draft':
        return 'Draft';
      case CustomerAcceptanceStatus.Success:
      case 'Success':
        return 'Download succeeded';
      case CustomerAcceptanceStatus.Failed:
      case 'Failed':
        return 'Download failed';
      case CustomerAcceptanceStatus.Ready:
      case 'Ready':
        return 'Ready';
      case CustomerAcceptanceStatus.CustomerNewPendingApproval:
      case 'CustomerNewPendingApproval':
        return 'Pending';
      case CustomerAcceptanceStatus.CustomerRejectedNoAction:
      case 'CustomerRejectedNoAction':
        return 'Rejected (No action)';
      case CustomerAcceptanceStatus.CustomerRejected:

      case 'CustomerRejected':
        return 'Rejected';
      case CustomerAcceptanceStatus.CustomerApproved:
      case 'CustomerApproved':
        return 'Approved';
      case CustomerAcceptanceStatus.CustomerReworked:
      case 'CustomerReworked':
        return 'Reworked';
      case CustomerAcceptanceStatus.CustomerReworkedPendingApproval:
      case 'CustomerReworkedPendingApproval':
        return 'Reworked-Pending';
      case CustomerAcceptanceStatus.CustomerAcceptanceNotRequired:
      case 'CustomerAcceptanceNotRequired':
        return 'View only';
      case CustomerAcceptanceStatus.Abandoned:
      case 'Abandoned':
        return 'Abandoned';
      case CustomerAcceptanceStatus.DeemedApproved:
      case 'DeemedApproved':
        return 'Deemed approved';
      case CustomerAcceptanceStatus.AcceptanceDocumentInitiate:
      case 'AcceptanceDocumentInitiate':
        return 'Transfer initiated';
      case CustomerAcceptanceStatus.AcceptanceDocumentReady:
      case 'AcceptanceDocumentReady':
        return 'Transfer ready';
      case CustomerAcceptanceStatus.AcceptanceDocumentSent:
      case 'AcceptanceDocumentSent':
        return 'Transfer successful';
      case CustomerAcceptanceStatus.AcceptanceDocumentSendFailed:
      case 'AcceptanceDocumentSendFailed':
        return 'Transfer failed';
      case 'Corrupted':
        return 'Corrupted';
      default:
        return 'Unknown';
    }
  }

  static getMultiActionStatus(status: string): string {
    switch (status) {
      case CustomerMultiLevelActionStatus.CustomerNewPendingApproval:
      case 'CustomerNewPendingApproval':
        return 'Pending';
      case CustomerMultiLevelActionStatus.CustomerRejectedNoAction:
      case 'CustomerRejectedNoAction':
        return 'Rejected (No action)';
      case CustomerMultiLevelActionStatus.CustomerRejected:      
      case 'CustomerRejected':
        return 'Rejected';
      case CustomerMultiLevelActionStatus.CustomerApproved:
      case 'CustomerApproved':
        return 'Approved';
      case CustomerMultiLevelActionStatus.CustomerReworkedPendingApproval:
      case 'CustomerReworkedPendingApproval':
        return 'Reworked-Pending';
      case CustomerMultiLevelActionStatus.CustomerAcceptanceNotRequired:
      case 'CustomerAcceptanceNotRequired':
        return 'View only';
      case CustomerMultiLevelActionStatus.DeemedApproved:
      case 'DeemedApproved':
        return 'Deemed approved';
      case CustomerMultiLevelActionStatus.CustomerAwaiting:
      case 'CustomerAwaiting':
        return 'Awaiting';
      case CustomerMultiLevelActionStatus.CustomerNoActionRequired:
      case 'CustomerNoActionRequired':
        return 'No action required';
      case CustomerMultiLevelActionStatus.NotApplicable:
      case 'NotApplicable':
        return 'Not applicable';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get paginated result
   * @param numPerPage input as a string
   *  @param selectedPage input as a string
   * @param evidenceDetails input as Evidence
   */
  static paginate(evidenceDetails: Evidence[], numPerPage: number, selectedPage: number): Evidence[] {
    return evidenceDetails.slice((selectedPage - 1) * numPerPage, selectedPage * numPerPage);
  }

  static getLevelIcon(level: string): string {
    let ngClass: string;
    switch (level) {
      case 'Activity':
        ngClass = 'icon-trowel';
        break;
      case 'Workplan':
        ngClass = 'icon-tasks';
        break;
      case 'Site':
        ngClass = 'icon-radio-base-antenna';
        break;
      case 'NetworkSite':
        ngClass = 'icon-radio-base-antenna';
        break;
      case 'Milestone':
        ngClass = 'icon-medal';
        break;
      case 'checklist':
        ngClass = 'icon-list';
        break;
      case 'LineItems':
        ngClass = 'icon-drag-handle'
        break;
      case 'Evidence':
        ngClass = 'icon-folder'
        break;
    }
    return ngClass;
  }

  static getRoleDisplayName(userRole: string): string {
    let roleTag: string;

    switch (userRole) {
      case 'CustomerApprover':
        roleTag = 'Approver'
        break;
      case 'CustomerObserver':
        roleTag = 'Observer'
        break;
      case 'CustomerApprover,CustomerObserver':
        roleTag = 'Approver'
        break;
      case 'CustomerObserver,CustomerApprover':
        roleTag = 'Approver'
        break;
      default:
        roleTag = ''
        break;
    }

    return roleTag;
  }

}
