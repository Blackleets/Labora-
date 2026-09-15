
import { ApprovalRequest, ApprovalStatus } from '../../../types';
import { auditService } from '../audit/AuditService';

const STORAGE_KEY = 'labora_approvals';

export const approvalService = {
  
  createRequest: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): ApprovalRequest => {
    const newRequest: ApprovalRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const existing = approvalService.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newRequest, ...existing]));

    auditService.logEvent({
      user_id: request.requesterId,
      organization_id: request.organizationId,
      country_code: 'GLOBAL',
      module: 'approvals',
      action: 'create_request',
      summary: `Request: ${request.entityType} triggered by ${request.policyTriggered}`,
      details: request.payload,
      request_id: newRequest.id
    });

    return newRequest;
  },

  getAll: (): ApprovalRequest[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  getPending: (): ApprovalRequest[] => {
    return approvalService.getAll().filter(r => r.status === 'pending');
  },

  resolveRequest: (requestId: string, status: 'approved' | 'rejected', resolverId: string) => {
    const requests = approvalService.getAll();
    const target = requests.find(r => r.id === requestId);
    
    if (!target) throw new Error("Request not found");

    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status,
          resolvedAt: new Date().toISOString(),
          resolvedBy: resolverId
        };
      }
      return req;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests));

    auditService.logEvent({
      user_id: resolverId,
      organization_id: target.organizationId,
      country_code: 'GLOBAL',
      module: 'approvals',
      action: status === 'approved' ? 'approve_request' : 'reject_request',
      summary: `${status.toUpperCase()} Request ${target.entityType}`,
      details: { requestId, originalPayload: target.payload },
      request_id: requestId,
      status: 'success'
    });

    return target;
  }
};
