import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, catchError, expand, map, of, reduce, takeWhile, throwError } from 'rxjs';
import { CountriesList, CreateCustomerResponse, CustomerDetails, CustomerInfo, CustomerShort, CustomersResponse, CustomersShortResponse } from './customer-onboarding.interface';
import { FilterSortConfiguration } from '../shared/table-server-side-pagination/table-server-side-pagination.component';


@Injectable()
export class CustomerService {
  fetchedCustomerIds = signal([]);

  constructor(
    private httpService: HttpClient
  ) {
  }

  /**
   * Gets the list of all customers known
   * @param sortOrder optional in form of `'&sort=desc(lastModifiedDate)'`
   */
  public getCustomers(limit: number, offset: number, sortOrder?: string): Observable<CustomersResponse> {
    let url = `/customers?limit=${limit}&offset=${offset}`;
    if (sortOrder) {
      url = url.concat(`${sortOrder}`);
    }
    return this.httpService.get<CustomersResponse>(url);
  }

  /**
   * Gets the list of all customers known
   * @param sortOrder optional in form of `'&sort=desc(lastModifiedDate)'`
   */
  public getCustomersShort(limit: number, offset: number, sortOrder?: string): Observable<CustomersShortResponse> {
    let url = `/customers/short?limit=${limit}&offset=${offset}`;
    if (sortOrder) {
      url = url.concat(`${sortOrder}`);
    }
    return this.httpService.get<CustomersShortResponse>(url);
  }

  public searchCustomers(limit: number, offset: number, filterSort?: FilterSortConfiguration): Observable<CustomersShortResponse> {
    const url = '/customers/short';
    let params: HttpParams = new HttpParams().set('limit', limit).set('offset', offset);

      if (filterSort) {
        Object.keys(filterSort).forEach(key => {
          if (filterSort[key].sortingOrder !== '') {
            const sortValue = `${filterSort[key].sortingOrder}(${key})`;
            params = params.set('sort', sortValue);
          }

          if (!filterSort[key].searchText || filterSort[key].searchText.trim() === '') {
            return;
          }

          if (key.toLowerCase().includes('date')) {
            const dateString = new Date(filterSort[key].searchText).toISOString().slice(0, 10);
            const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
            params = params.set(key, dateString).set('timeZone', timeZone);
          }
          else {
            params = params.set(key, filterSort[key].searchText);
          }
        });
      }

    return this.httpService.get<CustomersShortResponse>(url, { params });
  }

  /**
   * Fetch all customers
   * @param sortOrder optional in form of `'&sort=desc(lastModifiedDate)'`
   */
  public getAllCustomers(sortOrder?: string): Observable<CustomerShort[]> {
    const limit = 100;
    return of({
      morePages: true,
      limit,
      nextOffset: 0,
      results: []
    }).pipe(
      expand(data => {
        if (data.morePages) {
          return this.getCustomersShort(
            limit,
            data.nextOffset,
            sortOrder,
          );
        }
        return EMPTY;
      }),
      takeWhile(data => data !== undefined),
      map(data => {
        return data.results;
      }),
      reduce((acc, results) => ([...acc, ...results])),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Error Status: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => {
          return errorMessage;
        });
      }),
    );
  }

  /**
   * Gets customer details by customer Id
   *
   * @param customerId the id of the customer for which the detail has to be fetched
   */
  public getCustomerByCustomerId(customerId: string): Observable<CustomerDetails> {
    const url = `/customers/${customerId}`;
    return this.httpService.get<CustomerDetails>(url);
  }

  /**
   * Creates the new customer.
   * @param customerDetails details of the newly created customer
   * @returns details
   */
  public createNewCustomer(customerDetails: CustomerDetails): Observable<CreateCustomerResponse[]> {
    return this.createNewCustomers([customerDetails]);
  }

  private createNewCustomers(customers: CustomerDetails[]): Observable<CreateCustomerResponse[]> {
    const url = `/customers`;
    return this.httpService.post<CreateCustomerResponse[]>(url, customers);
  }

  /**
   * update the existing customer details
   * @param customerDetails update the existing customer details
   * @returns customer details
   */
  public updateExistingCustomer(customerDetails: CustomerDetails): Observable<CustomerDetails> {
    const url = `/customers/${ customerDetails.customerId}`;
    return this.httpService.put<CustomerDetails>(url,customerDetails);
  }

  public getAllCountries(): Observable<CountriesList> {
    const url = `/countries`;
    return this.httpService.get<CountriesList>(url);
  }

  public getSiteTrackerCustomers(): Observable<CustomerInfo[]> {
    const url = `/sitetracker/customers`;
    return this.httpService.get<CustomerInfo[]>(url);
  }
}
