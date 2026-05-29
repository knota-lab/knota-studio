/** Single permission from GET /api/permissions (paginated) */
export interface PermissionResponse {
  id: string;
  name: string;
  code: string;
  obj: string;
  act: string;
  /** Backend serializes as "type" via #[serde(rename = "type")] */
  permissionType: string;
  isSystem: boolean;
  version: number;
}

export interface UpdatePermissionRequest {
  name?: string;
  code?: string;
  obj?: string;
  act?: string;
  permissionType?: string;
  isSystem?: boolean;
  version: number;
}

export interface SyncPermissionItem {
  path: string;
  method: string;
}

export interface SyncPermissionsRequest {
  items: SyncPermissionItem[];
}

/** Route metadata from OpenAPI spec */
export interface RouteMetadataItem {
  path: string;
  method: string;
  tag: string;
  description: string;
}

export interface PermissionWithMetadata extends PermissionResponse {
  tag: string;
  description: string;
}

export interface PermissionsWithMetadataResponse {
  permissions: PermissionWithMetadata[];
  unmatchedRoutes: RouteMetadataItem[];
}

export interface AssignablePermissionsResponse {
  permissions: PermissionWithMetadata[];
  assignedPermissionIds: string[];
}

export type MergedPermissionStatus = 'active' | 'new' | 'stale';

export interface MergedPermission {
  /** Unique key for table rowKey (permission.id or `new-${path}-${method}`) */
  id: string;
  /** Route path (from obj for active/stale, from route for new) */
  path: string;
  /** HTTP method */
  method: string;
  /** Module tag */
  tag: string;
  /** API description */
  description: string;
  /** Permission name (only for active/stale) */
  name?: string;
  /** System built-in flag */
  isSystem?: boolean;
  status: MergedPermissionStatus;
  /** Actual DB permission ID (for active/stale) */
  permissionId?: string;
  /** Optimistic lock version */
  version?: number;
}
