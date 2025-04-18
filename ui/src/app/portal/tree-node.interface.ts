import { Observable } from 'rxjs';

export interface TreeNode {
  id: string;
  nodeType: string;
  type: string;
  name: string;
  icon?: string;
  subTree?: TreeNode[];
  subTreeObservable?: Observable<TreeNode[]>;
  enabledLink?: boolean;
  /** path to use to locate the target */
  uri?: string;
}
