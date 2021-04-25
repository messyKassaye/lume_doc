/** @format */

import Joi from 'joi';

import { validation } from 'api/utils';
import needsAuthorization from '../auth/authMiddleware';
import users from './users';

const getDomain = req => `${req.protocol}://${req.get('host')}`;
export default app => {
  app.post(
    '/api/users',

    needsAuthorization(['admin', 'editor']),

    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.objectId().required(),
          __v: Joi.number(),
          username: Joi.string(),
          email: Joi.string(),
          password: Joi.string(),
          role: Joi.string().valid('admin', 'editor'),
          using2fa: Joi.boolean(),
        })
        .required()
    ),

    (req, res, next) => {
      users
        .save(req.body, req.user, getDomain(req))
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.post(
    '/api/users/new',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          username: Joi.string().required(),
          email: Joi.string().required(),
          password: Joi.string(),
          role: Joi.string()
            .valid('admin', 'editor')
            .required(),
        })
        .required()
    ),
    (req, res, next) => {
      users
        .newUser(req.body, getDomain(req))
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.post(
    '/api/unlockaccount',
    validation.validateRequest(
      Joi.object()
        .keys({
          username: Joi.string().required(),
          code: Joi.string().required(),
        })
        .required()
    ),
    (req, res, next) => {
      users
        .unlockAccount(req.body)
        .then(() => res.json('OK'))
        .catch(next);
    }
  );

  app.post(
    '/api/recoverpassword',
    validation.validateRequest(
      Joi.object()
        .keys({
          email: Joi.string().required(),
        })
        .required()
    ),
    (req, res, next) => {
      users
        .recoverPassword(req.body.email, getDomain(req))
        .then(() => res.json('OK'))
        .catch(next);
    }
  );

  app.post(
    '/api/resetpassword',
    validation.validateRequest(
      Joi.object()
        .keys({
          key: Joi.string().required(),
          password: Joi.string().required(),
        })
        .required()
    ),
    (req, res, next) => {
      users
        .resetPassword(req.body)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get('/api/users', needsAuthorization(), (_req, res, next) => {
    users
      .get()
      .then(response => res.json(response))
      .catch(next);
  });

  app.delete(
    '/api/users',
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.string().required(),
        })
        .required(),
      'query'
    ),
    (req, res, next) => {
      users
        .delete(req.query._id, req.user)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
