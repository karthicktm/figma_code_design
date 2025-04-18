import { Component, ElementRef, EventEmitter, HostListener, input, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Tree } from '@eds/vanilla';
import { TreeNode } from './tree-node.interface';
import AcceptancePackageUtils from 'src/app/projects/project/acceptance-package-utilities';
import { NodeInfoDialogComponent } from 'src/app/projects/project-structure/node-info-dialog/node-info-dialog.component';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { CheckList } from 'src/app/projects/projects.interface';
import { ReplaySubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.less']
})
export class TreeComponent implements OnChanges, OnDestroy, OnInit {
  /** The node to be rendered as tree */
  @Input() readonly node: TreeNode;
  @Input() isEdit: boolean;
  @Input() readonly rootNodeIndex: number;
  @Input() readonly projectId: string;
  @Input() checklists: CheckList[];
  @Input() readonly selected: TreeNode;
  @Output() readonly selectedCheckList: EventEmitter<TreeNode> = new EventEmitter();
  @Output() readonly activate: EventEmitter<TreeNode> = new EventEmitter();
  @ViewChild('tree') readonly treeElement: ElementRef<HTMLElement>;
  @HostListener('focusin') onFocusIn(): void {
    this.onActivate();
  }
  @HostListener('mouseenter') onMouseEnter(): void {
    this.onActivate();
  }
  checklistIds = [];
  /** Setting this property as `true` will immediately cause subscribing of the `node.subTreeObservable` */
  @Input() isActivated: boolean;
  readonly doLITableReset = input.required<ReplaySubject<boolean>>();
  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private dialogService: DialogService,
  ) { }
  ngOnInit(): void {
    if (this.isEdit) {
      this.checklistIds = this.checklists.map((data: CheckList) => data.checkListId);
      const firstChecklist = this.checklists.find(() => true);
      if (firstChecklist) {
        const mappedChecklist = this.mapCheckListToTreeNode(firstChecklist);
        this.selectNode(mappedChecklist);
      }
    }

    this.subscription.add(this.doLITableReset().subscribe(value => {
      if (value) {
        this.selectedCheckList.emit(undefined);
      }
    }))
  }
  private mapCheckListToTreeNode(checklist: CheckList): TreeNode {
    const mappedNode: TreeNode = {
      id: checklist.checkListId,
      nodeType: 'checklist',
      type: 'Checklist',
      name: checklist.name,
      enabledLink: true,
    }
    return mappedNode;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.rootNodeIndex === 0) this.onActivate();
    const { selected } = changes
    if (selected.currentValue) {
      const currentValue: TreeNode = selected.currentValue
      this.treeElement?.nativeElement.getElementsByClassName(currentValue.id).item(0)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  ngOnDestroy(): void {
    this.scripts.forEach((script) => {
      script.destroy();
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private onActivate(): void {
    if (!this.isActivated)
      this.activate.emit(this.node);
    this.isActivated = true;
  }

  initTree(treeElement: HTMLElement): void {
    if (this.isActivated && this.scripts.length === 0) {
      const treeDOM: HTMLElement = treeElement;
      if (treeDOM) {
        const tree = new Tree(treeDOM);
        tree.init();
        this.scripts.push(tree)
      }
    }
  }

  selectNode(node: TreeNode): void {
    if (node.nodeType === 'checklist' || node.nodeType === 'LineItems') {
      this.selectedCheckList.emit(node);
    }
  }

  getLevelIcon(status: string): string {
    return AcceptancePackageUtils.getLevelIcon(status);
  }

  openLevelDetails(event: MouseEvent, id: string, node: TreeNode): void {
    if (event) {
      event.stopPropagation();
    }

    this.dialogService.createDialog(
      NodeInfoDialogComponent,
      { nodeId: id, type: node.type, nodeType: node.nodeType, projectId: this.projectId }
    );
  }


}
