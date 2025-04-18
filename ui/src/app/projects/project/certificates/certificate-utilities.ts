import { ActionedByMe, CertificateRequestStatus, CertificateSignatoryStatus } from '../../projects.interface';

export default class CertificateUtils {

  /* Defining common property names for certificate feature */
  // name of create certificate wizard step2 
  static createCertificateWizardStep2 = 'create-certificate-step2';
  // value of maximum tag name length
  static certificateTagNameLength = 255
  
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
    kdb.appendChild(document.createTextNode(CertificateUtils.getStatus(status)));
    switch (status) {
      case CertificateRequestStatus.complete:
      case CertificateRequestStatus.certified:
        kdb.classList.add(
          'green',
        );
        return kdb;
      case CertificateRequestStatus.ready:
      case CertificateRequestStatus.inProgress:
        kdb.classList.add(
          'purple',
        );
        return kdb;
      case CertificateRequestStatus.rejected:
        kdb.classList.add(
          'red',
        );
        return kdb;
      default:
        return kdb;
    }
  }

  /**
   * Get status from enum
   * @param status input as a string
   */
  static getStatus(status: string): string {
    switch (status) {
      case CertificateRequestStatus.complete:
      case CertificateRequestStatus.certified:
        return 'Certified';
      case CertificateRequestStatus.ready:
      case CertificateRequestStatus.inProgress:
        return 'Pending';
      case CertificateRequestStatus.rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
   /**
   * Get tag element with signatory status dependent color and text.
   * @param status to translate
   */
  static getSignatoryStatusTag(status: string, options?: { big: boolean }): HTMLElement {
    const kdb = document.createElement('kbd');
    kdb.classList.add(
      'tag',
    );
    if (options?.big === true) {
      kdb.classList.add(
        'big',
      );
    }
    kdb.appendChild(document.createTextNode(CertificateUtils.getSignatoryStatus(status)));
    switch (status) {
      case CertificateSignatoryStatus.ready:
        kdb.classList.add(
          'blue',
        );
        return kdb;
      case CertificateSignatoryStatus.notReady:
        kdb.classList.add(
          'purple',
        );
        return kdb;
      case CertificateSignatoryStatus.complete:
      case CertificateSignatoryStatus.rejected:
      case CertificateSignatoryStatus.notApplicable:    
        kdb.classList.add(
          'grey',
        );
        return kdb;
      default:
        return kdb;
    }
  }

  /**
   * Get status from enum
   * @param status input as a string
   */
  static getSignatoryStatus(status: string): string {
    switch (status) {
      case CertificateSignatoryStatus.complete:
      case CertificateSignatoryStatus.rejected:
        return 'Completed';
      case CertificateSignatoryStatus.notReady:
        return 'Awaiting';
      case CertificateSignatoryStatus.ready:
        return 'In-review';
      case CertificateSignatoryStatus.notApplicable:
        return 'Not applicable';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get tag element with ActionedByMe status dependent color and text.
   * @param status to translate
   */
  static getActionedByMeTag(status: string, options?: { big: boolean }): HTMLElement {
    const kdb = document.createElement('kbd');
    kdb.classList.add(
      'tag',
    );
    if (options?.big === true) {
      kdb.classList.add(
        'big',
      );
    }
    kdb.appendChild(document.createTextNode(CertificateUtils.getActionedByMe(status)));
    switch (status) {
      case ActionedByMe.done:
      case ActionedByMe.rejected:
      case ActionedByMe.nA:
        kdb.classList.add(
          'grey',
        );
        return kdb;
      case ActionedByMe.yetToSign:
        kdb.classList.add(
          'blue',
        );
        return kdb;
      case ActionedByMe.waiting:
        kdb.classList.add(
          'purple',
        );
        return kdb;
      default:
        return kdb;
    }
  }

  /**
   * Get status from enum
   * @param status input as a string
   */
  static getActionedByMe(status: string): string {
    switch (status) {
      case ActionedByMe.done:
      case ActionedByMe.rejected:
        return 'Completed';
      case ActionedByMe.waiting:
        return 'Awaiting'
      case ActionedByMe.yetToSign:
        return 'In-review';
      case ActionedByMe.nA:
        return 'Not applicable';
      default:
        return 'Unknown';
    }
  }
}
