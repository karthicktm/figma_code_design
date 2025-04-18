import { Component, input, model, signal } from '@angular/core';
import { EmailNotificationRecipientTypes } from 'src/app/projects/projects.interface';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-recipient-types',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './recipient-types.component.html',
  styleUrl: './recipient-types.component.less'
})
export class RecipientTypesComponent {
  readonly value = model<EmailNotificationRecipientTypes[]>();
  options = EmailNotificationRecipientTypes;
  readonly id = input.required<string>();
  readonly isEditMode = signal<boolean>(false);

  onSelect(event: CustomEvent<{ value: EmailNotificationRecipientTypes[] }>): void {
    this.value.set(event.detail.value);
  }

  toggle(option: EmailNotificationRecipientTypes): void {
    const types = this.value();
    if (types.includes(option)) this.value.set(types.filter(typ => typ !== option));
    else this.value.set([...types, option].sort());
  }
}
