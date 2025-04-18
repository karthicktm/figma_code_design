import { PageInfo } from '../projects/projects.interface';

export interface Configuration{
  key: string;
  value: string;
  isSoftDeleted: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  createdByUsername: string;
  lastModifiedByUsername: string;

}
export interface ConfigurationResponse extends Configuration, PageInfo {
  results: Configuration[];
}
export interface ConfigurationRequest {
  configurations: NewConfiguration[];
}
export interface NewConfiguration{
  key: string;
  value: string;
  valueType: 'Number' | 'String' | 'Boolean' | 'JSON';
}
export interface UpdateConfiguration{
  value: string;
}

export interface ConfigurationSearchModel{
  timeZone?: string;
  key?: string;
  value?: string;
  isSoftDeleted?: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
}
