import Joi from 'joi';
import cookieParser from 'cookie-parser';
import mongoConnect from 'connect-mongo';
import passport from 'passport';
import session from 'express-session';
import svgCaptcha from 'svg-captcha';
import settings from 'api/settings';
import urljoin from 'url-join';
import { DB } from 'api/odm';
import { config } from 'api/config';
import cors from 'cors';
import request from 'shared/JSONRequest';
import { CaptchaModel } from './CaptchaModel';

import { validation } from '../utils';

import './passport_conf.js';

const MongoStore = mongoConnect(session);

export default app => {
  app.use(cookieParser());

  app.use(
    session({
      secret: app.get('env') === 'production' ? config.userSessionSecret : 'harvey&lola',
      store: new MongoStore({
        mongooseConnection: DB.connectionForDB(config.SHARED_DB),
      }),
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.post(
    '/api/login',

    validation.validateRequest(
      Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
        token: Joi.string(),
      }).required()
    ),

    (req, res, next) => {
      passport.authenticate('local', (err, user) => {
        if (err) {
          next(err);
          return;
        }
        req.logIn(user, error => {
          if (error) {
            next(err);
            return;
          }
          res.status(200);
          res.json({ success: true });
        });
      })(req, res, next);
    }
  );

  app.get('/api/user', (req, res) => {
    res.json(req.user || {});
  });

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  const corsOptions = {
    origin: true,
    methods: 'GET',
    credentials: true,
    optionsSuccessStatus: 200,
  };

  app.get('/api/captcha', cors(corsOptions), async (_req, res) => {
    const captcha = svgCaptcha.create({ ignoreChars: '0OoiILluvUV' });
    const storedCaptcha = await CaptchaModel.save({ text: captcha.text });

    res.json({ svg: captcha.data, id: storedCaptcha._id.toString() });
  });

  app.get('/api/remotecaptcha', async (_req, res) => {
    const { publicFormDestination } = await settings.get({}, { publicFormDestination: 1 });
    const remoteResponse = await request.get(urljoin(publicFormDestination, '/api/captcha'));
    res.json(remoteResponse.json);
  });
};
