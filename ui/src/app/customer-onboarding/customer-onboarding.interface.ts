import { PageInfo } from '../projects/projects.interface';

export interface CustomerDetails {
  customerId: string;
  customerName: string;
  globalCustomerUnit: string;
  customerDescription?: string;
  region: string;
  subRegion: string;
  country: string;
  city: string;
  state: string;
  address: string;
  extendedAttributes: Attribute[];
  lastModifiedBy?: string,
  lastModifiedData?: string,
}

export interface CreateCustomerResponse {
  customerId: string,
  status: 'Success' | 'Error',
  description: string,
}

export interface CustomersResponse {
  morePages: boolean,
  nextOffset: number,
  currentRecordCount: number,
  totalRecords: number,
  totalPages: number,
  currentPage: number,
  results: CustomerDetails[];
}

export type CustomerShort = Pick<CustomerDetails, 'customerId' | 'customerName' | 'country' | 'lastModifiedBy' | 'lastModifiedData'>;

export interface CustomersShortResponse extends PageInfo {
  results: CustomerShort[]
}

export interface Attribute {
  attributeName: string;
  attributeType: string;
  attributeValue: string;
}

export interface CountriesList {
  countries: string[];
}

export interface CustomerInfo {
  customerId : string;  
  customerName : string;
  country : string;
}