import contact from './contact';
import { validation } from '../utils';

export default app => {
  app.post(
    '/api/contact',
    validation.validateRequest({
      properties: {
        body: {
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 3 },
            message: { type: 'string', minLength: 5 },
          },
          required: ['email', 'name', 'message'],
        },
      },
    }),
    async (req, res, next) => {
      try {
        await contact.sendMessage(req.body);
        res.json('ok');
      } catch (err) {
        next(err);
      }
    }
  );
};
