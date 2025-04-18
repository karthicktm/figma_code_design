import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})

export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) { return []; }
    if (!searchText) { return items; }
    searchText = searchText.toLowerCase();

    const array = [];
    items.forEach(cat => {
      const filteredCategory = cat.category;
      cat.iconItems.forEach( itemRow => {
        const filteredTags = [];

        itemRow.tags.filter( i => {
          if (i.toLowerCase().includes(searchText)) {
            filteredTags.push(i);
          }
        });
        if (filteredTags.length > 0) {
          const existingCat = array.find(c => {
            return c.category === filteredCategory;
          });
          if (existingCat !== undefined) {
            existingCat.iconItems.push({
              name: itemRow.name,
              tags: filteredTags
            });
          } else {
            array.push({
              category: cat.category,
              iconItems: [
                {name: itemRow.name,
                tags: filteredTags}
              ]
            });
          }
        }
      });

    });
    return array;
  }
}
