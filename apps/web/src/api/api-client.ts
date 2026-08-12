import { databases, functions, storage, APPWRITE_DB_ID } from '../lib/appwrite';
import { ID, Query, ExecutionMethod, Permission, Role } from 'appwrite';

export interface CreateTaskInput {
  title: string;
  description?: string;
  eventId: string;
  workType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  currentAssigneeId: string;
  deadline: string;
}

export interface NotificationInput {
  recipientId: string;
  type: 'DRAFT_SUBMITTED' | 'REVISION_SUBMITTED';
  title: string;
  message: string;
  taskId: string;
  versionId?: string;
  createdById: string;
}

export interface UpdateUserAccessInput {
  userId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  roles: string[];
  events: string[];
}

export interface CreateUserInput {
  name: string;
  roles: string[];
  events: string[];
}

export interface CreateEventInput {
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  color?: string;
  coordinatorAssignments: { userId: string; role: 'CHIEF_COORDINATOR' | 'MARKETING_COORDINATOR' }[];
  newCoordinatorName?: string;
  newCoordinatorRole?: 'CHIEF_COORDINATOR' | 'MARKETING_COORDINATOR';
}

export class ApiError extends Error {
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// A thin Appwrite-backed API client
export const api = {
  getAdminEvents: async () => {
    const execution = await functions.createExecution({
      functionId: 'api-admin-access', body: JSON.stringify({ action: 'LIST_EVENTS' }), async: false,
      xpath: '/events', method: ExecutionMethod.POST, headers: { 'content-type': 'application/json' },
    });
    let payload: any = {};
    try { payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}; }
    catch { throw new ApiError('The administration service returned an invalid response.', 'INVALID_RESPONSE'); }
    if (execution.responseStatusCode >= 400 || !payload.success) throw new ApiError(payload.error || 'Could not load events.');
    return payload.events as any[];
  },
  createEvent: async (data: CreateEventInput) => {
    const execution = await functions.createExecution({
      functionId: 'api-admin-access', body: JSON.stringify({ action: 'CREATE_EVENT', ...data }), async: false,
      xpath: '/events', method: ExecutionMethod.POST, headers: { 'content-type': 'application/json' },
    });
    let payload: any = {};
    try { payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}; }
    catch { throw new ApiError('The administration service returned an invalid response.', 'INVALID_RESPONSE'); }
    if (execution.responseStatusCode >= 400 || !payload.success) throw new ApiError(payload.error || 'Could not create this event.');
    return payload;
  },
  deleteEvent: async (eventId: string) => {
    const execution = await functions.createExecution({
      functionId: 'api-admin-access', body: JSON.stringify({ action: 'DELETE_EVENT', eventId }), async: false,
      xpath: '/events', method: ExecutionMethod.POST, headers: { 'content-type': 'application/json' },
    });
    let payload: any = {};
    try { payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}; }
    catch { throw new ApiError('The administration service returned an invalid response.', 'INVALID_RESPONSE'); }
    if (execution.responseStatusCode >= 400 || !payload.success) throw new ApiError(payload.error || 'Could not remove this event.');
    return payload;
  },
  createUser: async (data: CreateUserInput) => {
    const execution = await functions.createExecution({
      functionId: 'api-admin-access',
      body: JSON.stringify({ action: 'CREATE_USER', ...data }),
      async: false,
      xpath: '/users',
      method: ExecutionMethod.POST,
      headers: { 'content-type': 'application/json' },
    });
    let payload: any = {};
    try { payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}; }
    catch { throw new ApiError('The administration service returned an invalid response.', 'INVALID_RESPONSE'); }
    if (execution.responseStatusCode >= 400 || !payload.success) {
      throw new ApiError(payload.error || 'Could not create this user.', payload.code, payload);
    }
    return payload;
  },
  deleteUser: async (userId: string) => {
    const execution = await functions.createExecution({
      functionId: 'api-admin-access', body: JSON.stringify({ action: 'DELETE_USER', userId }), async: false,
      xpath: '/users', method: ExecutionMethod.POST, headers: { 'content-type': 'application/json' },
    });
    let payload: any = {};
    try { payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}; }
    catch { throw new ApiError('The administration service returned an invalid response.', 'INVALID_RESPONSE'); }
    if (execution.responseStatusCode >= 400 || !payload.success) throw new ApiError(payload.error || 'Could not remove this user.');
    return payload;
  },
  updateUserAccess: async (data: UpdateUserAccessInput) => {
    const execution = await functions.createExecution({
      functionId: 'api-admin-access',
      body: JSON.stringify(data),
      async: false,
      xpath: '/user-access',
      method: ExecutionMethod.POST,
      headers: { 'content-type': 'application/json' },
    });
    let payload: any = {};
    try { payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}; }
    catch { throw new ApiError('The administration service returned an invalid response.', 'INVALID_RESPONSE'); }
    if (execution.responseStatusCode >= 400 || !payload.success) {
      throw new ApiError(payload.error || 'Could not update this user assignment.', payload.code, payload);
    }
    return payload.user;
  },
  // Phase 1: Tasks
  createTask: async (data: CreateTaskInput) => {
    const execution = await functions.createExecution({
      functionId: 'api-tasks-assignments',
      body: JSON.stringify({ action: 'CREATE_AND_ASSIGN', task: data }),
      async: false,
      xpath: '/tasks',
      method: ExecutionMethod.POST,
      headers: { 'content-type': 'application/json' },
    });

    let payload: any = {};
    try {
      payload = execution.responseBody ? JSON.parse(execution.responseBody) : {};
    } catch {
      throw new ApiError('The task service returned an invalid response.', 'INVALID_RESPONSE');
    }

    if (execution.responseStatusCode >= 400 || !payload.success) {
      throw new ApiError(payload.message || payload.error || 'Failed to create task.', payload.code, payload);
    }

    return payload.task;
  },
  getTasks: async () => {
    return await databases.listDocuments(APPWRITE_DB_ID, 'tasks', [Query.orderDesc('$createdAt')]);
  },
  assignTask: async (taskId: string, assigneeId: string) => {
    return await databases.createDocument(APPWRITE_DB_ID, 'task_assignments', ID.unique(), {
      taskId,
      assigneeId,
      assignedAt: new Date().toISOString()
    });
  },
  
  // Phase 2: Uploads and Versions
  uploadFile: async (bucketId: string, file: File) => {
    return await storage.createFile(bucketId, ID.unique(), file, [
      Permission.read(Role.users()),
      Permission.update(Role.users()),
    ]);
  },
  getFilePreview: (bucketId: string, fileId: string) => {
    return storage.getFilePreview(bucketId, fileId);
  },
  getFileView: (bucketId: string, fileId: string) => {
    return storage.getFileView(bucketId, fileId);
  },
  completeUpload: async (fileId: string) => {
    return {};
  },
  submitVersion: async (taskId: string, data: any) => {
    return await databases.createDocument(APPWRITE_DB_ID, 'deliverable_versions', ID.unique(), {
      taskId,
      ...data
    }, [Permission.read(Role.users()), Permission.update(Role.users())]);
  },
  updateTaskStatus: async (taskId: string, status: string) => {
    return await databases.updateDocument(APPWRITE_DB_ID, 'tasks', taskId, { status });
  },
  getVersions: async (taskId: string) => {
    return await databases.listDocuments(APPWRITE_DB_ID, 'deliverable_versions', [Query.equal('taskId', taskId), Query.orderDesc('$createdAt')]);
  },
  approveVersion: async (versionId: string, data: any) => {
    // Function call to handle approval logic
    return await databases.updateDocument(APPWRITE_DB_ID, 'deliverable_versions', versionId, { status: 'APPROVED' });
  },
  requestRevision: async (versionId: string, data: any) => {
    return await databases.updateDocument(APPWRITE_DB_ID, 'deliverable_versions', versionId, { status: 'REVISION_REQUESTED' });
  },
  
  // Phase 3: Annotations and Feedback
  createAnnotation: async (versionId: string, data: any) => {
    return await databases.createDocument(APPWRITE_DB_ID, 'annotations', ID.unique(), {
      versionId,
      ...data
    });
  },
  resolveAnnotation: async (annotationId: string) => {
    return await databases.updateDocument(APPWRITE_DB_ID, 'annotations', annotationId, { status: 'RESOLVED' });
  },
  submitFeedback: async (versionId: string, data: any) => {
    return await databases.createDocument(APPWRITE_DB_ID, 'reviews', ID.unique(), {
      versionId,
      ...data
    });
  },
  getMarketingPlans: async () => {
    return await databases.listDocuments(APPWRITE_DB_ID, 'marketing_plan_items', [Query.limit(500)]);
  },
  createMarketingPlan: async (data: any) => {
    return await databases.createDocument(APPWRITE_DB_ID, 'marketing_plan_items', ID.unique(), data);
  },
  updateMarketingPlan: async (id: string, data: any) => {
    const isPosted = [data?.status, data?.finalStatus]
      .some((value) => typeof value === 'string' && value.trim().toLowerCase() === 'posted');
    const consistentData = isPosted
      ? { ...data, finalStatus: 'Posted', designStatus: 'Posted', captionStatus: 'Posted' }
      : data;
    return await databases.updateDocument(APPWRITE_DB_ID, 'marketing_plan_items', id, consistentData);
  },
  deleteMarketingPlan: async (id: string) => {
    return await databases.deleteDocument(APPWRITE_DB_ID, 'marketing_plan_items', id);
  },
  getDesignerPacks: async () => {
    return await databases.listDocuments(APPWRITE_DB_ID, 'designer_packs', [Query.limit(100)]);
  },
  getUsers: async () => {
    return await databases.listDocuments(APPWRITE_DB_ID, 'users', [Query.limit(100)]);
  },
  createNotification: async (data: NotificationInput) => {
    return await databases.createDocument(APPWRITE_DB_ID, 'notifications', ID.unique(), {
      ...data,
      isRead: false,
    }, [
      Permission.read(Role.user(data.recipientId)),
      Permission.update(Role.user(data.recipientId)),
      Permission.delete(Role.user(data.recipientId)),
    ]);
  },
  getNotifications: async (recipientId: string) => {
    return await databases.listDocuments(APPWRITE_DB_ID, 'notifications', [
      Query.equal('recipientId', recipientId),
      Query.orderDesc('$createdAt'),
      Query.limit(20),
    ]);
  },
  markNotificationRead: async (notificationId: string) => {
    return await databases.updateDocument(APPWRITE_DB_ID, 'notifications', notificationId, { isRead: true });
  },
};

export const apiClient = {
  get: async (endpoint: string): Promise<any> => {
    console.warn(`Mock GET ${endpoint} using Appwrite not fully mapped`);
    return { data: {} };
  },
  post: async (endpoint: string, data: any): Promise<any> => {
    console.warn(`Mock POST ${endpoint} using Appwrite not fully mapped`);
    return { data: {} };
  },
  put: async (endpoint: string, data: any): Promise<any> => {
    console.warn(`Mock PUT ${endpoint} using Appwrite not fully mapped`);
    return { data: {} };
  },
  delete: async (endpoint: string): Promise<any> => {
    console.warn(`Mock DELETE ${endpoint} using Appwrite not fully mapped`);
    return { data: {} };
  },
};
