import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUserPayload, Role, AdminSubRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2026-flipkart-shopezy-secure';

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    } catch {
      // ignore optional auth errors
    }
  }
  next();
}

export function rbacGuard(allowedRoles: Role[], allowedSubRoles?: AdminSubRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized access.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' does not have permission.`,
      });
    }

    if (req.user.role === 'ADMIN' && allowedSubRoles && allowedSubRoles.length > 0) {
      const userSubRole = req.user.adminSubRole;
      // SUPER_ADMIN has access to all sub-role protected routes
      if (userSubRole !== 'SUPER_ADMIN' && (!userSubRole || !allowedSubRoles.includes(userSubRole))) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: admin sub-role '${userSubRole || 'NONE'}' is not authorized. Required: ${allowedSubRoles.join(', ')}`,
        });
      }
    }

    next();
  };
}
