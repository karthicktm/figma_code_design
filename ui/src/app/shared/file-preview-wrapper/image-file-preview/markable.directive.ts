import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DialogService } from 'src/app/portal/services/dialog.service';
import { MarkerDescriptionDialogComponent } from '../marker-description-dialog/marker-description-dialog.component';
import { take } from 'rxjs/operators';

const svgNs = 'http://www.w3.org/2000/svg';
interface Rect {
  /** left */
  x: number;
  /** top */
  y: number;
  height: number;
  width: number;
  shape: 'rect';
  uuid: string;
}

export interface RectMarker extends Rect {
  /** comment */
  description?: string;
}

@Directive({
  selector: 'svg[appMarkable]'
})
export class MarkableDirective implements AfterViewInit {

  @Input() readonly appMarkable: RectMarker[] = [];
  @Input() readonly edit: boolean;
  @Output() readonly markingsChange: EventEmitter<RectMarker[]> = new EventEmitter();

  private markings: RectMarker[] = [];

  constructor(
    private el: ElementRef<SVGSVGElement>,
    private dialogService: DialogService,
  ) {
  }

  ngAfterViewInit(): void {
    setTimeout(() => { // TODO: replace by observer strategy as the image might not be placed and sized correctly at this time.
      const markableElementRect: DOMRect = this.el.nativeElement.getBoundingClientRect();
      if (markableElementRect.x > 0 && markableElementRect.y > 0) {
        this.markings = this.appMarkable;
        this.appMarkable.forEach((marker) => {
          this.handleDrawStart(marker);
        });
      }
    }, 500);
  }

  @HostListener('mousedown', ['$event']) onMousedown(event: MouseEvent): MouseEvent {
    if (!this.edit) return event;
    if (event.button === 0) {
      const rect: RectMarker = { shape: 'rect', x: event.x, y: event.y, height: 0, width: 0, uuid: crypto.randomUUID() };
      this.handleDrawStart(rect, event);
    }
    return event;
  }

  private handleDrawStart(rect: RectMarker, event?: MouseEvent): void {
    const markingAreaSVG = this.el.nativeElement;

    const svgPoint = (elem: SVGSVGElement, x: number, y: number, transform = true): DOMPoint => {
      const p = elem.createSVGPoint();
      p.x = x;
      p.y = y;
      return transform ? p.matrixTransform(elem.getScreenCTM().inverse()) : p;
    };

    const rectElement: SVGRectElement = document.createElementNS(svgNs, rect.shape);
    const start = event
      ? svgPoint(markingAreaSVG, event.clientX, event.clientY)
      : svgPoint(markingAreaSVG, rect.x, rect.y, false);
    rectElement.classList.add(`marker-${rect.uuid}`);
    rectElement.id = `${rect.uuid}`;
    rectElement.style.strokeWidth = '3';
    rectElement.style.stroke = 'rgb(0,0,0)';
    rectElement.setAttribute('fill', 'transparent');
    if (!event) {
      rectElement.setAttribute('x', `${start.x}`);
      rectElement.setAttribute('y', `${start.y}`);
      rectElement.setAttribute('width', `${rect.width}`);
      rectElement.setAttribute('height', `${rect.height}`);
    }

    markingAreaSVG.appendChild(rectElement);

    const drawRect = (event: MouseEvent): void => {
      const p = svgPoint(markingAreaSVG, event.clientX, event.clientY);
      const w = Math.abs(p.x - start.x);
      const h = Math.abs(p.y - start.y);
      if (p.x > start.x) {
        p.x = start.x;
      }

      if (p.y > start.y) {
        p.y = start.y;
      }

      rectElement.setAttribute('x', `${p.x}`);
      rectElement.setAttribute('y', `${p.y}`);
      rectElement.setAttribute('width', `${w}`);
      rectElement.setAttribute('height', `${h}`);
    };

    const endDraw = (): void => {
      markingAreaSVG.removeEventListener('mousemove', drawRect);
      markingAreaSVG.removeEventListener('mouseup', endDraw);
      // clean-up the rect from viewing drawing action
      markingAreaSVG.removeChild(rectElement);

      if (rectElement.width.baseVal.value === 0 && rectElement.height.baseVal.value === 0) {
        rectElement.parentElement.removeChild(rectElement);
        return
      }

      const rectMarker: RectMarker = {
        x: start.x,
        y: start.y,
        width: rectElement.width.baseVal.value,
        height: rectElement.height.baseVal.value,
        shape: 'rect',
        uuid: rectElement.id,
      };

      // add the rect wrapped by anchor to add title
      const markerAnchor = document.createElementNS(svgNs, 'a');
      markerAnchor.appendChild(rectElement)
      markingAreaSVG.appendChild(markerAnchor);

      // Render the action buttons related to the rect marker
      //
      // <div class="btn-group horizontal">
      //   <button class="btn icon-btn"><i class="icon icon-trashcan"></i></button>
      //   <button class="btn icon-btn"><i class="icon icon-edit"></i></button>
      // </div>
      const btnGroup = document.createElement('div');
      btnGroup.classList.add('btn-group', 'horizontal');
      btnGroup.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('btn', 'icon-btn');
      btnGroup.appendChild(deleteButton);
      const trashcanIcon = document.createElement('i');
      trashcanIcon.classList.add('icon', 'icon-trashcan');
      deleteButton.appendChild(trashcanIcon);
      const foreignObject = document.createElementNS(svgNs, 'foreignObject');
      foreignObject.setAttribute('x', `${rectMarker.x + rectMarker.width - 40}`);
      foreignObject.setAttribute('y', `${rectMarker.y}`);
      // Make the elements content visible even if width and height are kept 0.
      foreignObject.setAttribute('overflow', 'visible');
      foreignObject.appendChild(btnGroup);

      markingAreaSVG.appendChild(foreignObject);

      const clearMarking = (): void => {
        if (!this.edit) return;
        rectElement.parentElement.removeChild(rectElement);
        foreignObject.parentElement.removeChild(foreignObject);
        const index = this.markings.findIndex(element => element.uuid === rectElement.id);
        this.markings.splice(index, 1);
      };

      deleteButton.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        clearMarking();
      });

      if (event) {
        const dialogRef = this.dialogService.createDialog(
          MarkerDescriptionDialogComponent,
        );

        dialogRef.instance.dialogResult.pipe(take(1)).subscribe((result) => {
          if (result === false) {
            clearMarking();
            return;
          }

          rectMarker.description = result.toString() || `Marker with id: ${rectMarker.uuid}`;
          const title = document.createElementNS(svgNs, 'title');
          markerAnchor.appendChild(title);
          title.appendChild(document.createTextNode(rectMarker.description));

          this.markings
            ? this.markings.push(rectMarker)
            : this.markings = [rectMarker];
          this.markingsChange.emit(this.markings);
        });
      }
      else {
        rectMarker.description = rect.description.toString() || `Marker with id: ${rectMarker.uuid}`;
        const title = document.createElementNS(svgNs, 'title');
        markerAnchor.appendChild(title);
        title.appendChild(document.createTextNode(rectMarker.description));
      }
    };

    if (event) {
      markingAreaSVG.addEventListener('mousemove', drawRect);
      markingAreaSVG.addEventListener('mouseup', endDraw);
    }
    else {
      endDraw();
    }
  }

}
