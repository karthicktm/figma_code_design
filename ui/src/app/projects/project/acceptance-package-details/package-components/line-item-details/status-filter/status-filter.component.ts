import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { PillGroup } from '@eds/vanilla';
import { CacheKey, SessionStorageService } from 'src/app/portal/services/session-storage.service';
import { EvidenceFilter, UserSession } from 'src/app/projects/projects.interface';

@Component({
  selector: 'app-status-filter',
  templateUrl: './status-filter.component.html',
  styleUrls: ['./status-filter.component.less']
})
export class StatusFilterComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('pill') readonly pillRef: ElementRef<HTMLElement>;
  @Input() readonly selectedFilter: string[] = [];
  @Input() readonly offChain: boolean = false;
  @Output() readonly changeStatus: EventEmitter<any> = new EventEmitter();
  private pill: PillGroup;

  EvidenceFilter = EvidenceFilter;
  allOptions: boolean;
  constructor(
    private sessionStorageService: SessionStorageService,
  ) { }

  ngOnInit(): void {
    const userSession = this.sessionStorageService.get<UserSession>(CacheKey.userSession);
    if (userSession?.userType.toUpperCase() === 'ERICSSON') {
      this.allOptions = true;
    }
  }
  ngAfterViewInit(): void {
    const pillDom = this.pillRef.nativeElement;
    const pill = new PillGroup({
      element: pillDom as HTMLElement,
      action: (): void => filterCards(),
    });
    pill.init();
    const filterPills = pill.getPills();
    const filterCards = (): void => {
      const pillKeys = filterPills
        .filter(pill => pill.isSelected())
        .map(pill => pill.data['key']);
      this.changeStatus.emit(pillKeys);
    }
    this.pill = pill;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedFilter
      && !changes.selectedFilter.firstChange
      && changes.selectedFilter.currentValue.includes(EvidenceFilter.ALL)
      && this.pill
    ) {
      this.pill.selectAllPills();
    }
  }
  ngOnDestroy(): void {
    this.pill.destroy();
  }

  statusUnselected(status: string): boolean {
    return this.selectedFilter?.length >= 0
      ? !this.selectedFilter.includes(EvidenceFilter.ALL) && !this.selectedFilter.includes(status)
      : true;
  }
}
