import { HttpStatusCode } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, signal, ViewChildren } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, ReplaySubject, Subscription, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NetworkRollOutService } from 'src/app/network-roll-out/network-roll-out.service';
import { NotificationService } from 'src/app/portal/services/notification.service';
import { CheckList, PackageNetworkElement, PackageWorkItem, SiteTaxonomy, WorkItem } from 'src/app/projects/projects.interface';
import { TreeNode } from './tree/tree-node.interface';
import { FormDataService } from '../../form-data.service';
import { FormControl, FormGroup } from '@angular/forms';
import AcceptancePackageUtils from '../../../acceptance-package-utilities';
import { SelectOptions } from '../../acceptance-package-form-step5/acceptance-package-form-step5.component';

@Component({
  selector: 'app-navigation-tree',
  templateUrl: './navigation-tree.component.html',
  styleUrls: ['./navigation-tree.component.less']
})
export class NavigationTreeComponent implements OnInit, OnDestroy {
  @Input() isEdit: boolean;
  @Input() packageForm: FormGroup;
  @Input() checkList: TreeNode;
  @Input() doLITableReset: ReplaySubject<boolean>;
  @ViewChildren('tree') readonly treeElementRef: QueryList<ElementRef<HTMLElement>>;
  @Output() selectedCheckList: EventEmitter<TreeNode> = new EventEmitter();
  private subscription: Subscription = new Subscription();

  navigationTree: Observable<TreeNode[]>;
  public projectId: string;
  checklists: PackageNetworkElement[] = [];
  navigationTreeNodes: TreeNode[];
  private readonly isWorkplanBased = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private networkRollOutService: NetworkRollOutService,
    private notificationService: NotificationService,
    private sharedService: FormDataService
  ) { }

  ngOnInit(): void {
    const step2FormGroup = this.packageForm.controls.step2 as FormGroup;
    const multiSelectOption = step2FormGroup.controls.multiSelectOption as FormControl<string>;
    if (multiSelectOption.value && multiSelectOption.value === SelectOptions.WORKPLAN) this.isWorkplanBased.set(true);
    this.subscription.add(multiSelectOption.valueChanges.subscribe((selectedOption) => {
      if (selectedOption === SelectOptions.WORKPLAN) this.isWorkplanBased.set(true);
      else this.isWorkplanBased.set(false);
    }));
    if (this.isEdit) {
      this.subscription.add(this.route.parent.paramMap.subscribe((params: ParamMap) => {
        this.projectId = params.get('id');
        this.navigationTree = this.getNavigationTree();
        const step3FormGroup = this.packageForm.controls.step3 as FormGroup;
        if (this.isWorkplanBased()) {
          const workplans = step3FormGroup.controls.workplans as FormControl<PackageWorkItem[]>;
          this.checklists = this.findAllByKey(workplans.value, 'checklists');
        } else {
          const networkElements = step3FormGroup.controls.networkElements as FormControl<PackageNetworkElement[]>;
          this.checklists = this.findAllByKey(networkElements.value, 'checklists');
        }
      }));
    } else {
      this.subscription.add(this.route.parent.paramMap.subscribe((params: ParamMap) => {
        this.projectId = params.get('id');
        this.navigationTree = this.getNavigationTree();
      }));
    }
  }

  getNavigationTree(): Observable<TreeNode[]> {
    return this.sharedService.data.pipe(
      switchMap(ids => {
        if (ids.length > 0) {
          const mapTaxonomy = (taxonomy): TreeNode => {
            const subtree = taxonomy.workItems?.length > 0
              ? this.mapWorkItemsNavigationToTree(taxonomy)
              : undefined;
            const siteTreeNode: TreeNode = {
              id: taxonomy.internalId,
              nodeType: 'site',
              icon: AcceptancePackageUtils.getLevelIcon('Site'),
              name: taxonomy.name,
              type: 'Site',
              subTree: subtree,
              subTreeObservable: of(subtree)
            };
            return siteTreeNode;
          };
          const handleError = (error): Observable<any> => {
            if (error.status === HttpStatusCode.BadGateway || error.status === HttpStatusCode.ServiceUnavailable || !navigator.onLine) {
              this.notificationService.showNotification({
                title: `Error getting ${this.isWorkplanBased() ? 'workplan' : 'site'} taxonomy`,
                description: 'Try again after few minutes. If issue still persist, please follow the FAQ doc for further steps.'
              }, true);
            } else {
              this.notificationService.showNotification({
                title: `Error getting ${this.isWorkplanBased() ? 'workplan' : 'site'} taxonomy`,
                description: 'Click to open the FAQ doc for further steps.'
              }, true);
            }
            return throwError(() => error);
          };

          if (!this.isWorkplanBased()) {
            return this.networkRollOutService.getMultiSiteTaxonomy(ids).pipe(
              map((sites: SiteTaxonomy[]) => {
                const siteTreeNodes = sites.filter(site => !site.isOnboarded === true || ids.includes(site.internalId))
                  .map(mapTaxonomy);
                return siteTreeNodes;
              }),
              catchError(handleError),
            );
          } else {
            return this.networkRollOutService.getMultiWorkplanTaxonomy(ids).pipe(
              map((sites: SiteTaxonomy[]) => {
                const siteTreeNodes = sites.map(mapTaxonomy);
                return siteTreeNodes;
              }),
              catchError(handleError),
            );
          }
        } else {
          return of([]);
        }
      }),
      catchError(error => {
        this.notificationService.showNotification({
          title: `Error getting site navigation`,
          description: 'Click to open the FAQ doc for further steps.'
        }, true);
        return of([]);
      }),
      tap(treeNodes => this.navigationTreeNodes = treeNodes)
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private mapWorkItemsNavigationToTree(siteHierarchy: SiteTaxonomy): TreeNode[] {
    const mappedWorkItemsTree = siteHierarchy.workItems
      .filter(item => !item.isOnboarded)
      .map(workItem => {
        return this.mapWorkItemToTreeNode(workItem);
      });

    if (!this.isWorkplanBased()) {
      // add a new node of type 'All Line Items' which is a first entry under a site in navigation tree
      const allItemsNode: TreeNode = {
        id: siteHierarchy.name,
        nodeType: 'LineItems',
        name: 'All Line Items',
        type: 'LineItems',
        icon: AcceptancePackageUtils.getLevelIcon('LineItems'),
        parentId: siteHierarchy.internalId,
        enabledLink: true,
      }
      // add at the front
      mappedWorkItemsTree.unshift(allItemsNode);
    }

    return mappedWorkItemsTree;
  }

  private mapWorkItemToTreeNode(workItem: WorkItem): TreeNode {
    const mappedNode: TreeNode = {
      id: workItem.internalId,
      nodeType: 'workItem',
      name: workItem.name,
      type: workItem.type,
      icon: AcceptancePackageUtils.getLevelIcon(workItem.type),
    }
    if (this.isWorkplanBased() && workItem.type === 'Workplan') {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      const allLineItemsNode: TreeNode = {
        id: workItem.name,
        nodeType: 'LineItems',
        type: 'LineItems',
        name: 'All line items',
        icon: AcceptancePackageUtils.getLevelIcon('LineItems'),
        parentId: workItem.internalId,
        enabledLink: true,
      };
      mappedNode.subTree.push(allLineItemsNode);
    }
    if (workItem.workItems && workItem.workItems.length > 0) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      workItem.workItems.filter(item => !item.isOnboarded).forEach(workItem => {
        const mappedWorkItem = this.mapWorkItemToTreeNode(workItem);
        mappedNode.subTree.push(mappedWorkItem);
      })
    }
    if (workItem.checkLists && workItem.checkLists.length > 0) {
      if (!mappedNode.subTree) {
        mappedNode.subTree = [];
      }
      workItem.checkLists.filter(item => !item.isOnboarded).forEach(checkList => {
        const mappedChecklist = this.mapCheckListToTreeNode(checkList);
        mappedNode.subTree.push(mappedChecklist);
      })
    }
    return mappedNode
  }

  private mapCheckListToTreeNode(checklist: CheckList): TreeNode {
    const mappedNode: TreeNode = {
      id: checklist.internalId,
      nodeType: 'checklist',
      icon: AcceptancePackageUtils.getLevelIcon('checklist'),
      type: 'Checklist',
      name: checklist.name,
      enabledLink: true,
    }
    return mappedNode;
  }

  public findAllByKey(obj: Object, keyToFind: string): any[] {
    return Object.entries(obj)
      .reduce((acc, [key, value]) => (key === keyToFind)
        ? (acc.concat(value))
        : (typeof value === 'object' && value)
          ? acc.concat(this.findAllByKey(value, keyToFind))
          : acc
        , []);
  }
}
