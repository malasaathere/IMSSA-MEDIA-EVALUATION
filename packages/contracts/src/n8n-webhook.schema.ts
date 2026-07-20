// This defines the strict JSON payload that the NestJS API will emit to the n8n webhook URL.

export type N8nTaskEventAction = 'APPROVED' | 'REJECTED' | 'PUBLISHED';

export interface N8nTaskEventPayload {
  eventId: string;
  eventName: string;
  taskId: string;
  taskTitle: string;
  action: N8nTaskEventAction;
  triggerTime: string; // ISO 8601 string
  
  // Deliverable details
  deliverable: {
    versionId: string;
    fileUrl: string; // Presigned URL or public CDN link
    originalFileName: string;
    mimeType: string;
  };

  // Roles involved for email notification
  users: {
    marketingCoordinator: {
      id: string;
      email: string;
      name: string;
    };
    designer: {
      id: string;
      email: string;
      name: string;
    };
    director: {
      id: string;
      email: string;
      name: string;
    };
  };

  // Included if the action was a REJECTION or required REVISION
  feedback?: {
    comment: string;
    annotatedImageUrls?: string[];
  };

  // Extensibility field for future platforms (e.g. YouTube, Instagram specifics)
  metadata?: Record<string, any>;
}
