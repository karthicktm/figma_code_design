import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, input } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription, tap } from 'rxjs';
import { ProjectsService } from '../../../projects.service';
import { MultiPanelTile, Page } from '@eds/vanilla';
import { PackageNetworkElement, PackageTaxonomy } from 'src/app/projects/projects.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { SimplifiedTreeNode } from './taxonomy-tree/taxonomy-tree.component';

enum ComponentViewType {
  lineItems = 'Line items',
  lineItemEvidences = 'Line item evidences',
  milestoneEvidences = 'Milestone evidences',
}

@Component({
  selector: 'app-package-components',
  templateUrl: './package-components.component.html',
  styleUrls: ['./package-components.component.less'],
})
export class PackageComponentsComponent implements OnInit, OnDestroy, AfterViewInit {
  private scripts: Scripts[] = [];

  @ViewChild('multiPanelTile') private readonly multiPanelTileElementRef: ElementRef<HTMLElement>;
  @ViewChild('switch') readonly switchElementRef: ElementRef<HTMLInputElement>;
  @ViewChild('maximizeAction') readonly maximizeActionElementRef: ElementRef<HTMLElement>;
  @Input() isPackageCompleted: boolean;
  @Input() packageStatus: string;
  @Input() approvalRule: string;
  @Output() isUpdatePackageStatus = new EventEmitter<boolean>();
  readonly isMultiLevelAcceptance = input<boolean>();
  private subscription: Subscription = new Subscription();
  selectedTaxonomyFilter: SimplifiedTreeNode[];
  taxonomyFilterKey: PackageNetworkElement[];
  public packageLinearId: string;
  projectId: string;
  loader = false;
  limit: number = 10;
  offset: number = 0;
  show: ComponentViewType = ComponentViewType.lineItems;
  applyFilterFlag: boolean = false;
  applyTaxonomyFilter = false;
  clearTaxonomyFilter = false;
  isTileMaximized: boolean;
  tileMaximizeVisible: boolean;

  readonly ComponentViewType = ComponentViewType;
  readonly originalOrder = (): number => 0;

  constructor(
    private projectService: ProjectsService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      tap(paramMap => {
        const packageComponentsType = paramMap.get('packageComponentsType');
        if (packageComponentsType && Object.entries(ComponentViewType).find(entry =>  entry[0] === packageComponentsType) && packageComponentsType !== this.show) this.switchFilter(ComponentViewType[packageComponentsType]);
      })
    ).subscribe();
    this.packageLinearId = this.route.snapshot.paramMap.get('id');
    this.getLineItemTaxonomyByPackageId();

    document.addEventListener(
      'maximizeTile',
      this.onResizeTile
    );

    document.addEventListener(
      'minimizeTile',
      this.onResizeTile
    );
  }

  ngAfterViewInit(): void {
    const multiPanelTileDOM = this.multiPanelTileElementRef.nativeElement;
    if (multiPanelTileDOM) {
      const multiPanelTile = new MultiPanelTile(multiPanelTileDOM);
      multiPanelTile.init();
      this.scripts.push(multiPanelTile);
    }

    const page = new Page();
    page.init();
    this.scripts.push(page);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.scripts.forEach((script) => {
      script.destroy();
    });

    document.removeEventListener('maximizeTile', this.onResizeTile);
    document.removeEventListener('minimizeTile', this.onResizeTile);
  }

  /**
   * Changes the view to the requested context.
   */
  switchFilter(input: ComponentViewType): void {
    this.onClearTaxonomyFilter();
    this.applyFilterFlag = false;
    this.show = input;
    const packageComponentsType = Object.entries(ComponentViewType).find(entry => entry[1] === input)[0];
    const urlTree = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { packageComponentsType } });
    this.location.replaceState(urlTree.toString());
  }

  /**
   * Clears the input of all filter criteria
   */
  public clearAllFilters(selectionCleared: boolean): void {
    this.clearTaxonomyFilter = false;
    if (selectionCleared) {
      this.selectedTaxonomyFilter = [];
      this.applyFilterFlag = true;
    }
  }

  public onClearTaxonomyFilter(): void {
    this.clearTaxonomyFilter = true;
  }

  public onApplyTaxonomyFilter(): void {
    this.applyTaxonomyFilter = true;
  }

  /**
   * Apply filter
   */
  public filterLineItem(selection: SimplifiedTreeNode[]): void {
    this.applyTaxonomyFilter = false;
    if (selection && selection.length > 0) {
      this.applyFilterFlag = true;
      this.selectedTaxonomyFilter = selection;
    } else if (this.selectedTaxonomyFilter && this.selectedTaxonomyFilter.length > 0) {
      // in case empty selection is passed and there is previous taxonomy filter applied, the taxonomy filter shall be cleared
      this.clearAllFilters(true);
    }
  }

  /**
   * Get taxonomy by package id for filter functionality.
   */
  getLineItemTaxonomyByPackageId(): void {
    this.projectService.getTaxonomyByPackageId(this.packageLinearId).subscribe((data: PackageTaxonomy) => {
      this.taxonomyFilterKey = data.networkElements;
      this.projectId = data.projectId;
    });
  }

  private onResizeTile = (event): void => {
    if (event.detail.id === 'package-components') {
      if (event.type === 'maximizeTile') {
        this.isTileMaximized = true;
      } else {
        this.isTileMaximized = false;
      }
    }
  }
}
