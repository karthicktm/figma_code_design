import { HttpStatusCode } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, effect, input, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Tree } from '@eds/vanilla';
import { Subscription } from 'rxjs';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import AcceptancePackageUtils from '../../project/acceptance-package-utilities';
import { CheckList, SiteTaxonomy, WorkItem } from '../../projects.interface';
import { NodeInfoDialogComponent } from '../node-info-dialog/node-info-dialog.component';
import { NodeType } from '../node-type.interface';

interface TreeNode {
  id: string;
  nodeType: string;
  type: string;
  name: string;
  icon?: string;
  subTree?: TreeNode[];
  enabledLink?: boolean;
  /** path to use to locate the target */
  uri?: string;
  /** used for hierarchy filter **/
  needPrune?: boolean
  parent?: TreeNode,
  isRVisited?: boolean
}

interface WorkItemContext {
  id: string;
  type: string;
}

@Component({
  selector: 'app-site-navigation-tree',
  templateUrl: './site-navigation-tree.component.html',
  styleUrls: ['./site-navigation-tree.component.less']
})
export class SiteNavigationTreeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('tree') readonly treeElementRef: QueryList<ElementRef<HTMLElement>>;
  // external signal (for user options on the node type)
  hierarchyChangeSignal = input.required<{ [key: string]: { checked: boolean, disabled: boolean } }>();
  // internal signal (for tree taxonomy data)
  treeReady = signal<boolean>(false);

  private scripts: Scripts[] = [];
  private subscription: Subscription = new Subscription();

  NodeType = NodeType;
  navigationTree: TreeNode[];
  public projectId: string;
  public networkSiteId: string;
  root: TreeNode;
  rootClone: TreeNode;
  isInWorkItemContext: boolean;

  constructor(
    private networkRollOutService: NetworkRollOutService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private changeDetector: ChangeDetectorRef,
  ) {
    effect(() => {
      // get the external signal value
      const hierarchyChanges = this.hierarchyChangeSignal()
      // verify if internal signal for tree data and external signal is available
      if (this.treeReady() && hierarchyChanges) {
        this.hierarchyFilter(hierarchyChanges);
      }
    });
  }

  ngOnInit(): void {
    this.subscription.add(this.route.paramMap.subscribe((params: ParamMap) => {
      this.projectId = params.get('id');
      this.networkSiteId = params.get('networkSiteId');
      const workItem = this.route.snapshot.queryParamMap.keys.filter(paramKey => ['workplanId', 'milestoneId'].includes(paramKey))
        .map(paramKey => {
          return { id: this.route.snapshot.queryParamMap.get(paramKey), type: paramKey };
        })
        .find(() => true);
      this.isInWorkItemContext = !!workItem;
      this.retrieveAndMapSiteHierarchy(this.projectId, this.networkSiteId, workItem);
    }));
  }

  ngAfterViewInit(): void {
    if (this.treeElementRef.length > 0) {
      this.initTree(this.treeElementRef);
    } else {
      this.subscription.add(this.treeElementRef.changes.subscribe(treeElement => {
        this.initTree(treeElement);
      }));
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

  private initTree(treeElementQueryList: QueryList<ElementRef<HTMLElement>>): void {
    const treeDOM: HTMLElement = treeElementQueryList.first.nativeElement;
    if (treeDOM) {
      const tree = new Tree(treeDOM);

      tree.init();
      this.scripts.push(tree);
    }
  }

  private mapSiteHierarchyToTree(siteHierarchy: SiteTaxonomy, workItemContext?: WorkItemContext): void {
    this.navigationTree = [];

    // make a root node for making parent for Prune Graft algorithm
    const siteNode: TreeNode = {
      id: siteHierarchy.internalId,
      nodeType: NodeType.WorkItem,
      type: siteHierarchy.type,
      name: siteHierarchy.name,
      icon: this.getLevelIcon(siteHierarchy.type),
      parent: undefined,
      needPrune: false,
      isRVisited: false
    }
    this.root = siteNode
    this.root.subTree = []

    siteHierarchy.workItems.forEach(workItem => {
      const mappedWorkItem = this.mapWorkItemToTreeNode(workItem, workItemContext);
      this.insertSorted(this.root.subTree, mappedWorkItem)
    });

    // make the tree ready signal true , so that effect can make the hierarchy filter
    this.treeReady.set(true);
  }

  /*
    Modified Subtree pruning and regrafting (SPR) algorithm
    1.Deep Clone root
    2.Go till the depth, assign respective parent
      Also mark self as 'needPrune' , if there's no child (subtree) at all
    3.Go to each node , check if parent is in selected hierarchy list
      if yes, no op
      if no, find a ancestor who is in the selected hierarchy,
             mark current parent as 'need prune'
             make chosen ancestor as the parent (re-graft self)
   */
  private hierarchyFilter(hierarchy: { [key: string]: { checked: boolean, disabled: boolean } }): void {
    // only if taxonomy data is available
    if (this.root) {
      // for DOM re-creation
      this.navigationTree = [];
      this.changeDetector.detectChanges();
      // Deep clone
      this.rootClone = JSON.parse(JSON.stringify(this.root))
      // re-arrange
      this.rearrangeTree(this.rootClone, hierarchy);
      // get the subtree without site (as site is already available as span)
      this.navigationTree = this.filterTree(this.rootClone)?.subTree;
    }
  }

  rearrangeTree(node: TreeNode, hierarchy: { [key: string]: { checked: boolean, disabled: boolean } }): void {
    if (node.subTree) {
      for (const child of node.subTree) {
        if ((hierarchy[child.type] !== undefined && !hierarchy[child.type].checked) && !child?.subTree) {
          child.needPrune = true;
        }
        child.parent = node;
        this.rearrangeTree(child, hierarchy);
      }
    }

    if (node && node.parent && !node.isRVisited) {
      if (!hierarchy[node.parent.type].checked) {
        // Get the possible selected ancestor
        let ancestor = node.parent
        while (ancestor && !hierarchy[ancestor.type].checked) {
          ancestor = ancestor.parent;
        }
        // make the selected ancestor as this node's parent
        if (ancestor) {
          // mark for detaching itself from current parent
          node.parent.needPrune = true
          // make the selected ancestor as node's parent
          node.parent = ancestor
          // make the node visited as we are done with the process of reassigning to other parent
          node.isRVisited = true
          if (node.parent.subTree && node.parent.subTree.some((elem: TreeNode) => elem.id !== node.id)) {
            // assign current node as the selected ancestor's child
            this.insertSorted(node.parent.subTree, node)
          }
        }
      }
    }
  }

  /*
    Remove needPrune TreeNode(s)
   */
  filterTree(node: TreeNode): TreeNode | null {
    if (node.needPrune) {
      return null;
    }
    if (node.subTree) {
      node.subTree = node.subTree
        .map((child: TreeNode) => this.filterTree(child))
        .filter((child: TreeNode | null) => child !== null) as TreeNode[];
    }
    return node;
  }

  private mapWorkItemToTreeNode(workItem: WorkItem, workItemContext?: WorkItemContext): TreeNode {
    const mappedNode: TreeNode = {
      id: workItem.internalId,
      nodeType: NodeType.WorkItem,
      type: workItem.type,
      name: workItem.name,
      icon: this.getLevelIcon(workItem.type),
      needPrune: false,
      isRVisited: false
    }

    if (workItem.internalId === workItemContext?.id) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      const allLineItemsNode: TreeNode = {
        id: undefined,
        nodeType: NodeType.LineItems,
        type: NodeType.LineItems,
        name: 'All line items',
        icon: this.getLevelIcon(NodeType.LineItems),
        enabledLink: true,
        uri: `all-line-items`,
      };
      this.insertSorted(mappedNode.subTree, allLineItemsNode);
    }

    if (workItem.workItems && workItem.workItems.length > 0) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      workItem.workItems.forEach(workItemElem => {
        const mappedWorkItem = this.mapWorkItemToTreeNode(workItemElem);
        this.insertSorted(mappedNode.subTree, mappedWorkItem);
      })
    }

    if (workItem.checkLists && workItem.checkLists.length > 0) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      workItem.checkLists.forEach(checkList => {
        const mappedChecklist = this.mapCheckListToTreeNode(checkList);
        this.insertSorted(mappedNode.subTree, mappedChecklist);
      })
    }

    if (workItem.type === 'Milestone') {
      mappedNode.nodeType = NodeType.Milestone;
      mappedNode.enabledLink = true;
      mappedNode.uri = `${NodeType.Milestone}/${workItem.internalId}`;

      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      const evidencesContainerNode: TreeNode = {
        id: workItem.internalId,
        name: 'Milestone evidences',
        nodeType: NodeType.MilestoneEvidence,
        type: 'Evidence',
        icon: this.getLevelIcon('Evidence'),
        enabledLink: true,
        uri: `${NodeType.MilestoneEvidence}/${workItem.internalId}`,
      }
      this.insertSorted(mappedNode.subTree, evidencesContainerNode)
    }

    if (workItem.type === 'Workplan') {
      mappedNode.nodeType = NodeType.WorkPlan;
      mappedNode.enabledLink = true;
      mappedNode.uri = `${NodeType.WorkPlan}/${workItem.internalId}`;
    }

    return mappedNode;
  }

  private mapCheckListToTreeNode(checklist: CheckList): TreeNode {
    const mappedNode: TreeNode = {
      id: checklist.internalId,
      nodeType: NodeType.Checklist,
      type: 'Checklist',
      name: checklist.name,
      icon: this.getLevelIcon('checklist'),
      enabledLink: true,
      uri: `checklist/${checklist.internalId}`,
      needPrune: false,
      isRVisited: false
    }

    return mappedNode;
  }

  // use binary search to find the index and insert it
  insertSorted(treeNodeArr: TreeNode[], treeNode: TreeNode): void {
    let low = 0;
    let high = treeNodeArr.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (treeNodeArr[mid]['name'] < treeNode['name']) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    // Insert the new object at the index
    treeNodeArr.splice(low, 0, treeNode);
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

  retrieveAndMapSiteHierarchy(projectId: string, networkSiteId: string, workItem?: WorkItemContext): void {
    this.networkRollOutService.getSiteTaxonomy(projectId, networkSiteId, workItem?.id).subscribe({
      next: (siteTaxonomy: SiteTaxonomy) => {
        this.mapSiteHierarchyToTree(siteTaxonomy, workItem);
      },
      error: (error) => {
        console.error(error);
        if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
          this.notificationService.showNotification({
            title: `Error getting site taxonomy`,
            description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
          }, true);
        } else {
          this.notificationService.showNotification({
            title: `Error getting site taxonomy`,
            description: 'Click to open the FAQ doc for further steps.'
          }, true);
        }
      },
    });
  }

  public getLevelIcon(status: string): string {
    return AcceptancePackageUtils.getLevelIcon(status);
  }

  onRouterLinkActive(event: boolean): void {
    const treeDom: HTMLElement = this.treeElementRef?.first?.nativeElement;
    const activeElement = treeDom?.querySelector('.active')
    activeElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}
