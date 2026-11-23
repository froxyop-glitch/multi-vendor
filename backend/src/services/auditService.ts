import { prisma } from '../prisma';
import { Role, AdminSubRole } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export interface AuditLogParams {
  actorId?: string | null;
  actorEmail: string;
  actorRole: Role;
  actorSubRole?: AdminSubRole | null;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadataDiff?: any;
  req?: AuthenticatedRequest;
}

export async function recordAuditLog(params: AuditLogParams) {
  try {
    const ip = params.req?.headers['x-forwarded-for'] || params.req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = params.req?.headers['user-agent'] || 'API-Client';

    await prisma.auditLog.create({
      data: {
        actor_id: params.actorId || params.req?.user?.userId || null,
        actor_email: params.actorEmail || params.req?.user?.email || 'system@shopezy.com',
        actor_role: params.actorRole || params.req?.user?.role || 'ADMIN',
        actor_sub_role: params.actorSubRole || params.req?.user?.adminSubRole || null,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        summary: params.summary,
        metadata_diff: params.metadataDiff || {},
        ip_address: typeof ip === 'string' ? ip : Array.isArray(ip) ? ip[0] : '127.0.0.1',
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
