import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTasks, useDesignerPacks, useUsers } from "../../api/queries";
import { api } from "../../api/api-client";
import { useAuth } from "../../lib/auth-context";
import { BUCKETS } from "../../lib/appwrite-collections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { UploadCloud, CheckCircle2, CheckSquare, Loader2, MessageSquare } from "lucide-react";
import { WorkflowStepper } from "../layout/WorkflowStepper";
import { TaskChat } from "../kanban/TaskChat";

export function DesignerWorkspace() {
  const { user, profile } = useAuth();
  const { data: response, isLoading } = useTasks();
  const { data: usersResponse } = useUsers();
  const tasks = response?.documents || [];
  const assignedTasks = tasks.filter((task: any) => task.currentAssigneeId === user?.$id);
  const activeTask = assignedTasks.find((task: any) => task.status === 'IN_PROGRESS' || task.status === 'REVISION_REQUESTED') || assignedTasks[0];

  const { data: packsResponse, isLoading: packsLoading } = useDesignerPacks();

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [checklist, setChecklist] = useState<{id: string, text: string, checked: boolean}[]>([]);

  // Initialize checklist from designer packs
  useEffect(() => {
    if (packsResponse?.documents) {
      setChecklist(packsResponse.documents.map(doc => ({
        id: doc.$id,
        text: doc.text,
        checked: false
      })));
    }
  }, [packsResponse]);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles([...files, ...acceptedFiles]);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = async () => {
    if (!activeTask || files.length === 0) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    try {
      const existingVersions = await api.getVersions(activeTask.$id);
      let versionNumber = existingVersions.total + 1;
      const createdVersionIds: string[] = [];

      for (const file of files) {
        const uploadedFile = await api.uploadFile(BUCKETS.DRAFT_IMAGES, file);
        const version = await api.submitVersion(activeTask.$id, {
          versionNumber,
          fileId: uploadedFile.$id,
          submittedById: user?.$id || activeTask.currentAssigneeId,
          status: 'SUBMITTED',
        });
        createdVersionIds.push(version.$id);
        versionNumber += 1;
      }

      await api.updateTaskStatus(activeTask.$id, 'IN_REVIEW');

      const isRevision = activeTask.status === 'REVISION_REQUESTED';
      const recipients = (usersResponse?.documents || []).filter((candidate: any) => {
        const roles = Array.isArray(candidate.roles) ? candidate.roles : [];
        return roles.includes('MEDIA_DIRECTOR') || roles.includes('MARKETING_COORDINATOR');
      });
      const uniqueRecipients = Array.from(new Map(
        recipients.filter((recipient: any) => recipient.authUserId).map((recipient: any) => [recipient.authUserId, recipient])
      ).values()) as any[];

      const notificationResults = await Promise.allSettled(uniqueRecipients.map((recipient: any) =>
        api.createNotification({
          recipientId: recipient.authUserId,
          type: isRevision ? 'REVISION_SUBMITTED' : 'DRAFT_SUBMITTED',
          title: isRevision ? 'Revised design ready for review' : 'New design ready for review',
          message: `${profile?.name || 'A designer'} uploaded ${isRevision ? 'a revised design' : 'a new design'} for “${activeTask.title}”.`,
          taskId: activeTask.$id,
          versionId: createdVersionIds[0],
          createdById: user?.$id || activeTask.currentAssigneeId,
        })
      ));

      const notificationFailures = notificationResults.filter(result => result.status === 'rejected').length;
      setFiles([]);
      setSubmissionResult({
        type: 'success',
        message: notificationFailures === 0
          ? 'Successfully uploaded and submitted for review. Media Directors and Marketing Coordinators have been notified.'
          : `Successfully uploaded and submitted for review. ${notificationFailures} notification${notificationFailures === 1 ? '' : 's'} could not be delivered.`,
      });
    } catch (error: unknown) {
      console.error("Upload failed", error);
      setSubmissionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload and submit the design.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="animate-spin text-gold-500 h-10 w-10" /></div>;
  }

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-950">My Work</h1>
          <p className="text-sm text-text-muted">Designer & Editor Workspace</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 rounded-full border border-border bg-surface px-4 py-1.5">
            <span className="text-sm font-medium text-navy-950">Capacity: {activeTask ? '1' : '0'}/3</span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
              <div className={`h-full bg-info transition-all ${activeTask ? 'w-1/3' : 'w-0'}`} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Active Task Details */}
          <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
            {activeTask ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{activeTask.title}</CardTitle>
                    <Badge variant="info">{activeTask.status || 'IN PROGRESS'}</Badge>
                  </div>
                  <CardDescription>{activeTask.eventId || 'Event'} - Due {new Date(activeTask.deadline || Date.now()).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text mb-6">
                    {activeTask.description}
                  </p>
                  <WorkflowStepper currentStepId="draft" className="mb-6 hidden sm:block" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline"><MessageSquare className="mr-1 h-3 w-3" /> Discussion</Badge>
                    <Badge variant="outline"><CheckSquare className="mr-1 h-3 w-3" /> Brief</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-text-muted">
                  No active tasks assigned to you right now. Take a break!
                </CardContent>
              </Card>
            )}

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Draft</CardTitle>
                <CardDescription>Drag and drop your file here to submit for review.</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionResult && (
                  <div className={`mb-5 flex items-start gap-3 rounded-md border p-4 text-sm ${
                    submissionResult.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`} role="status">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{submissionResult.message}</span>
                  </div>
                )}
                <div 
                  {...getRootProps()} 
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                    isDragActive ? "border-focus bg-surface-selected" : "border-border hover:bg-surface"
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mb-4 h-10 w-10 text-navy-700" />
                  <p className="text-sm font-medium text-navy-950">
                    {isDragActive ? "Drop the files here" : "Click or drag files to upload"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Images up to 500MB, Video up to 5GB</p>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-semibold text-navy-950">Pending Submission</h4>
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <span className="text-sm font-medium text-text">{file.name}</span>
                        </div>
                        <span className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit for Review
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Revision Checklist */}
          <div className="flex flex-col space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revision Checklist</CardTitle>
                <CardDescription>Ensure these items are completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-4 w-4 rounded border-border text-navy-900 focus:ring-focus"
                      checked={item.checked}
                      onChange={() => setChecklist(checklist.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                    />
                    <span className={`text-sm ${item.checked ? 'text-text-muted line-through' : 'text-text'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Discussion</CardTitle>
                <CardDescription>
                  {activeTask ? `Messages for: ${activeTask.title}` : 'Select a task to view discussion'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTask ? (
                  <TaskChat taskId={activeTask.$id} />
                ) : (
                  <p className="text-sm text-text-muted text-center py-6">No active task selected.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
