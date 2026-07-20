import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string, assigneeId: string }) => api.assignTask(taskId, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useInitiateUpload() {
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: any }) => api.initiateUpload(taskId, data),
  });
}

export function useSubmitVersion() {
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: any }) => api.submitVersion(taskId, data),
  });
}

export function useApproveVersion() {
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string, data: any }) => api.approveVersion(versionId, data),
  });
}

export function useRequestRevision() {
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string, data: any }) => api.requestRevision(versionId, data),
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string, data: any }) => api.submitFeedback(versionId, data),
  });
}

export function useCreateAnnotation() {
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string, data: any }) => api.createAnnotation(versionId, data),
  });
}
