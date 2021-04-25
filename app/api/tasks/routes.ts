/**
 * Uwazi routes that start and inspect tasks.
 */

import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { Application, Request, Response } from 'express';
import { TaskProvider } from 'shared/tasks/tasks';

export const TASKS_ENDPOINT = 'tasks';
const tasksPrefix = `/api/${TASKS_ENDPOINT}`;

export default (app: Application) => {
  app.get(
    tasksPrefix,
    validation.validateRequest({
      properties: {
        query: {
          properties: {
            name: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request, res: Response) => {
      if (req.query?.name) {
        const task = TaskProvider.getByName(req.query?.name);
        return res.json(task?.status ?? { state: 'undefined' });
      }
      return res.json(TaskProvider.taskInstances);
    }
  );

  app.post(
    tasksPrefix,
    needsAuthorization(),
    validation.validateRequest({
      required: ['query', 'body'],
      properties: {
        query: {
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
        body: {},
      },
    }),

    async (req: Request, res: Response) => {
      const task = TaskProvider.getOrCreate(req.query?.name, req.query?.type);
      if (task.status.state === 'created') {
        task.start(req.body ?? {});
      }
      return res.json(task?.status ?? { state: 'undefined' });
    }
  );
};
