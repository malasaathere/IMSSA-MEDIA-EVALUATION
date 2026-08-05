import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });
}

export function useMarketingPlans() {
  return useQuery({
    queryKey: ['marketingPlans'],
    queryFn: api.getMarketingPlans,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateMarketingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createMarketingPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
}

export function useUpdateMarketingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMarketingPlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
}

export function useDeleteMarketingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMarketingPlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
}

export function useDesignerPacks() {
  return useQuery({
    queryKey: ['designerPacks'],
    queryFn: api.getDesignerPacks,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
  });
}

export function useNotifications(recipientId?: string) {
  return useQuery({
    queryKey: ['notifications', recipientId],
    queryFn: () => recipientId ? api.getNotifications(recipientId) : null,
    enabled: !!recipientId,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead(recipientId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', recipientId] }),
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

export function useVersions(taskId: string | null) {
  return useQuery({
    queryKey: ['versions', taskId],
    queryFn: () => taskId ? api.getVersions(taskId) : null,
    enabled: !!taskId,
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

import { listUserRequests } from './user-requests';

export function useUserRequests(statusFilter?: string) {
  return useQuery({
    queryKey: ['user_requests', statusFilter],
    queryFn: () => listUserRequests(statusFilter),
  });
}
