import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, UrlTree } from '@angular/router';

@Component({
  selector: 'app-router-link',
  standalone: true,
  imports: [
    RouterLink,
  ],
  templateUrl: './router-link.component.html',
  styleUrl: './router-link.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterLinkComponent {
  readonly text = input<string>();
  readonly link = input<string | any[] | UrlTree>();
  readonly onClick = output();
}
