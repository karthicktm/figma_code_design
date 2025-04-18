export default class RoleTitleMapping {
  static roleTooltipMapping = {
    'Ericsson Contributor': 'Implementation manager',
    'Project Admin': 'Customer project manager',
    'Customer Approver': 'Customer Acceptance Manager',
    'Customer Observer': 'Customer quality auditor'
  }

  // based on the source data, get the title (tool tip) text
  static assignTitleForGivenRole(roleText: string, roleTd: HTMLTableCellElement): void {
    if (roleText.includes('Project Admin')) {
      roleTd.title = this.roleTooltipMapping['Project Admin']
    }
    if (roleText.includes('Ericsson Contributor')) {
      if (roleTd.title.length > 0) {
        roleTd.title = roleTd.title + ',' + this.roleTooltipMapping['Ericsson Contributor'];
      } else {
        roleTd.title = this.roleTooltipMapping['Ericsson Contributor'];
      }
    }
    if (roleText === 'Customer Approver') {
      if (roleTd.title.length > 0) {
        roleTd.title = roleTd.title + ',' + this.roleTooltipMapping['Customer Approver'];
      } else {
        roleTd.title = this.roleTooltipMapping['Customer Approver'];
      }
    }
    if (roleText === 'Customer Observer') {
      if (roleTd.title.length > 0) {
        roleTd.title = roleTd.title + ',' + this.roleTooltipMapping['Customer Observer'];
      } else {
        roleTd.title = this.roleTooltipMapping['Customer Observer'];
      }
    }
  }
}