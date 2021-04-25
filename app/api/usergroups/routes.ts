import { Application, NextFunction, Request, Response } from 'express';
import { needsAuthorization } from 'api/auth';
import { userGroupSchema } from 'shared/types/userGroupSchema';
import { validation } from 'api/utils';
import userGroups from './userGroups';

export default (app: Application) => {
  app.get(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (_req: Request, res: Response) => {
      const groups = await userGroups.get({});
      res.json(groups);
    }
  );

  app.post(
    '/api/usergroups',
    needsAuthorization(['admin']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: userGroupSchema,
      },
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userGroup = await userGroups.save(req.body);
        res.json(userGroup);
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete(
    '/api/usergroups',
    needsAuthorization(['admin']),
    validation.validateRequest({
      properties: {
        query: {
          required: ['_id'],
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),
    async (req: Request, res: Response) => {
      const deletedGroup = await userGroups.delete(req.query);
      res.json(deletedGroup);
    }
  );
};
