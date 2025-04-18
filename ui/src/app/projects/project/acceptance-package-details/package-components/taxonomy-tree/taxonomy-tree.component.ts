import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Tree } from '@eds/vanilla';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NetworkElementInfoDialogComponent } from 'src/app/projects/details-dialog/network-element-info-dialog/network-element-info-dialog.component';
import { WorkItemInfoDialogComponent } from 'src/app/projects/details-dialog/work-item-info-dialog/work-item-info-dialog.component';
import { PackageNetworkElement } from 'src/app/projects/projects.interface';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';

export interface TreeNode {
  id: string,
  type: string,
  name: string,
  nodeType: string, //networkElement or workItem
  isChecked: boolean,
  isIndeterminate: boolean,
  subTree?: TreeNode[],
  parent?: TreeNode
};

export interface SimplifiedTreeNode {
  id: string,
  type: string,
  nodeType: string | 'networkElement',
  name: string
}

@Component({
  selector: 'app-taxonomy-tree',
  templateUrl: './taxonomy-tree.component.html',
  styleUrls: ['./taxonomy-tree.component.less']
})
export class TaxonomyTreeComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('tree') readonly treeElementRef: ElementRef<HTMLElement>;

  @Input() packageId: string;
  @Input() projectId: string;
  @Input() packageTaxonomy: PackageNetworkElement[];
  @Input() applyFilter: boolean;
  @Input() clearFilter: boolean;

  @Output() selectedFilter: EventEmitter<SimplifiedTreeNode[]> = new EventEmitter();
  @Output() selectionCleared: EventEmitter<boolean> = new EventEmitter();

  taxonomyTree: TreeNode[] = [];
  selectedNodeList: SimplifiedTreeNode[] = [];

  private scripts: Scripts[] = [];

  constructor(
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.mapTaxonomyToTree();
  }

  ngAfterViewInit(): void {
    const treeDOM: HTMLElement = this.treeElementRef.nativeElement;

    if (treeDOM) {
      const tree = new Tree(treeDOM);
      tree.init();
      this.scripts.push(tree);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.applyFilter
      && changes.applyFilter.currentValue !== changes.applyFilter.previousValue
      && changes.applyFilter.currentValue
    ) {
      this.confirmSelection();
    }

    if (!!changes.clearFilter
      && changes.clearFilter.currentValue !== changes.clearFilter.previousValue
      && changes.clearFilter.currentValue
    ) {
      this.clearSelection();
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });
  }

  private mapTaxonomyToTree(): void {
    this.packageTaxonomy.forEach(networkElement => {
      const mappedNetworkElement = this.mapNetworkElementToTreeNode(networkElement);
      this.taxonomyTree.push(mappedNetworkElement);
    });

  }

  private mapNetworkElementToTreeNode(networkElement: PackageNetworkElement): TreeNode {
    const mappedNode: TreeNode = {
      id: networkElement.networkElementId,
      type: networkElement.type,
      name: networkElement.name,
      nodeType: 'networkElement',
      isChecked: false,
      isIndeterminate: false
    }

    if (networkElement.networkElements && networkElement.networkElements.length > 0) {
      mappedNode.subTree = [];
      networkElement.networkElements.forEach(networkElement => {
        const mappedNetworkElement = this.mapNetworkElementToTreeNode(networkElement);
        mappedNetworkElement.parent = mappedNode;
        mappedNode.subTree.push(mappedNetworkElement);
      });
    }

    if (networkElement.workItems && networkElement.workItems.length > 0) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      networkElement.workItems.forEach(workItem => {
        const mappedWorkItem = this.mapWorkItemToTreeNode(workItem);
        mappedWorkItem.parent = mappedNode;
        mappedNode.subTree.push(mappedWorkItem);
      });
    }
    return mappedNode;
  }

  private mapWorkItemToTreeNode(workItem: any): TreeNode {
    const mappedNode: TreeNode = {
      id: workItem.workItemId,
      type: workItem.type,
      name: workItem.name,
      nodeType: 'workItem',
      isChecked: false,
      isIndeterminate: false
    }

    if (workItem.workItems && workItem.workItems.length > 0) {
      mappedNode.subTree = [];
      workItem.workItems.forEach(workItem => {
        // sub work item
        const mappedWorkItem = this.mapWorkItemToTreeNode(workItem);
        mappedWorkItem.parent = mappedNode;
        mappedNode.subTree.push(mappedWorkItem);
      });
    }

    // checklist under work item
    if (workItem.checklists && workItem.checklists.length > 0) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      workItem.checklists.forEach(checklist => {
        const mappedChecklist = this.mapChecklistToTreeNode(checklist);
        mappedChecklist.parent = mappedNode;
        mappedNode.subTree.push(mappedChecklist);
      });
    }
    return mappedNode;
  }


  private mapChecklistToTreeNode(checklist: any): TreeNode {
    const mappedNode: TreeNode = {
      id: checklist.checkListId,
      name: checklist.name,
      type: 'Checklist',
      nodeType: 'checklist',
      isChecked: false,
      isIndeterminate: false
    }
    return mappedNode;
  }

  /**
   * Updates the checked status along the tree branch when the state of a checkbox is changed
   * @param event change event of the checkbox
   * @param node the tree node bound to the checkbox
   */
  onChangeSelection(event, node: TreeNode): void {
    if (event) { event.stopPropagation(); }

    const checked = event.target.checked;
    node.isChecked = checked;
    node.isIndeterminate = false;

    this.updateChildren(node, checked);

    this.updateParent(node, checked);
  }

  private updateChildren(parentNode: TreeNode, checked: boolean): void {
    if (parentNode.subTree && parentNode.subTree.length > 0) {
      parentNode.subTree.forEach(child => {
        child.isChecked = checked;
        child.isIndeterminate = false;
        this.updateChildren(child, checked);
      })
    }
  }

  private updateParent(node: TreeNode, checked: boolean): void {
    const parent = node.parent;
    if (parent) {
      const all = parent.subTree.every(child => child.isChecked === checked);
      const anyIndeterminate = parent.subTree.find(child => child.isIndeterminate);
      if (anyIndeterminate) {
        parent.isIndeterminate = true;
        parent.isChecked = false;
      } else if (all) {
        parent.isIndeterminate = false;
        parent.isChecked = checked;
      } else {
        parent.isIndeterminate = true;
        parent.isChecked = false;
      }
      this.updateParent(parent, checked);
    }
  }

  private clearSelection(): void {
    if (this.taxonomyTree.length > 0) {
      this.taxonomyTree.forEach(treeNode => this.clearNodeSelection(treeNode));
      this.selectionCleared.emit(true);
    }
  }

  private clearNodeSelection(node: TreeNode): void {
    node.isChecked = false;
    node.isIndeterminate = false;

    if (node.subTree && node.subTree.length > 0) {
      node.subTree.forEach(treeNode => this.clearNodeSelection(treeNode));
    }
  }

  private confirmSelection(): void {
    this.selectedNodeList = [];
    if (this.taxonomyTree.length > 0) {
      this.taxonomyTree.forEach(treeNode => this.checkNodeSelection(treeNode));
      this.selectedFilter.emit(this.selectedNodeList);
    }
  }

  private checkNodeSelection(node: TreeNode): void {
    if (node.isChecked) {
      this.selectedNodeList.push({
        id: node.id,
        type: node.type,
        nodeType: node.nodeType,
        name: node.name
      });
    }

    if ((node.isChecked || node.isIndeterminate) && node.subTree && node.subTree.length > 0) {
      node.subTree.forEach(treeNode => this.checkNodeSelection(treeNode));
    }
  }

  /**
   * open dialog and display the details of one node
   * @param event mouse click event
   * @param id unique id of the related tree node
   * @param nodeType type of the tree node, expected are networkElement or workItem
   */
  openNodeDetails(event: MouseEvent, id: string, nodeType: string): void {
    if (event) { event.stopPropagation(); }

    // TODO: rename the info dialog component and check the layout of the dialog
    if (nodeType === 'networkElement') {
      this.dialogService.createDialog(
        NetworkElementInfoDialogComponent,
        { id: id, packageId: this.packageId, projectId: this.projectId }
      );
    } else if (nodeType === 'workItem') {
      this.dialogService.createDialog(
        WorkItemInfoDialogComponent,
        { id: id, packageId: this.packageId, projectId: this.projectId }
      );
    } else {
      console.error('Unsupported node type %s', nodeType);
    }
  }

  public getLevelIcon(status: string): string {
    return AcceptancePackageUtils.getLevelIcon(status);
  }
}
