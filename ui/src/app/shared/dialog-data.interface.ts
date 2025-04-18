/**
 * Interface definition for acceptance projects.
 */
export interface DialogData {
  dialogueTitle: string;
  show: APICallStatus;
  statusMessage?: string;
  buttonText?: string;
  additionalMessage?: string;
  progressValues?: ProgressValues;
  results?: ResultData[];
  iconStatus?:string;
  errorDetailList?: string[];
}

export interface ProgressValues {
  value: number;
  maxValue: number;
}

export interface ResultData {
  name: string;
  elements: {
    elementName: string;
    message?: string;
  }[];
}

// enum to define the status of the API call
export enum APICallStatus {
  // 1 for loading or submitting
  Loading = 1,
  // 2 for success
  Success = 2,
  // 3 for error
  Error = 3,
}
