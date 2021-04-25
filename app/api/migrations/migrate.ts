import { ConnectionOptions } from 'mongoose';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants/tenantContext';
import { config } from 'api/config';
import errorLog from 'api/log/errorLog';
import { migrator } from './migrator';

process.on('unhandledRejection', error => {
  throw error;
});

let auth: ConnectionOptions;

if (process.env.DBUSER) {
  auth = {
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

const run = async () => {
  await DB.connect(config.DBHOST, auth);
  const { db } = await DB.connectionForDB(config.defaultTenant.dbName);

  await tenants.run(async () => {
    await migrator.migrate(db);
  });
  //@ts-ignore
  errorLog.closeGraylog();
  await DB.disconnect();
};

run().catch(async e => {
  await DB.disconnect();
  throw e;
});
