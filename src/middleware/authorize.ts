import { Request, Response, NextFunction } from 'express';

export const authorize = (allowedRoles: string[]) => {

return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.currentUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRole = req.userRole;

      if (!userRole) {
        return res.status(403).json({ error: 'No role assigned' });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied`
        });
      }
      
      next();
      
    } catch (error) {
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

// export const checkPermission = (requiredPermission: string) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     try {
//       if (!req.currentUser) {
//         return res.status(401).json({ error: 'Authentication required' });
//       }
      
//       const permissions = req.currentUser.roleId?.permissions || [];
      
//       if (!permissions.includes(requiredPermission)) {
//         return res.status(403).json({ 
//           error: `Permission denied. Required: ${requiredPermission}` 
//         });
//       }
      
//       next();
//     } catch (error) {
//       res.status(500).json({ error: 'Permission check failed' });
//     }
//   };
// };