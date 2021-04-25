import { config } from 'api/config';
import request from '../app/shared/JSONRequest';
import elasticMapping from './elastic_mapping/elastic_mapping';

import { search } from '../app/api/search';
import templatesModel from '../app/api/templates';
import { IndexError } from '../app/api/search/entitiesIndex';
import elasticMapFactory from './elastic_mapping/elasticMapFactory';
import errorLog from '../app/api/log/errorLog';
import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';

const getIndexUrl = () => {
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  return `${elasticUrl}/${config.defaultTenant.indexName}`;
};

const setReindexSettings = async (refreshInterval, numberOfReplicas, translogDurability) =>
  request.put(`${getIndexUrl()}/_settings`, {
    index: {
      refresh_interval: refreshInterval,
      number_of_replicas: numberOfReplicas,
      translog: {
        durability: translogDurability,
      },
    },
  });

const restoreSettings = async () => {
  process.stdout.write('Restoring index settings...');
  const result = setReindexSettings('1s', 0, 'request');
  process.stdout.write(' [done]\n');
  return result;
};

const endScriptProcedures = async () =>
  new Promise((resolve, reject) => {
    errorLog.closeGraylog(async () => {
      try {
        await restoreSettings();
        await DB.disconnect();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

const indexEntities = async () => {
  const spinner = ['|', '/', '-', '\\'];
  let docsIndexed = 0;
  let pos = 0;

  await search.indexEntities({}, '+fullText', 10, indexed => {
    process.stdout.write(
      `Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`
    );
    pos = (pos + 1) % 4;
    docsIndexed += indexed;
  });

  return docsIndexed;
};

/*eslint-disable max-statements*/
const prepareIndex = async () => {
  process.stdout.write(`Deleting index ${config.defaultTenant.indexName}...`);
  try {
    await request.delete(getIndexUrl());
  } catch (err) {
    // Should not stop on index_not_found_exception
    if (err.json.error.type === 'index_not_found_exception') {
      process.stdout.write('\r\nThe index was not found:\r\n');
      process.stdout.write(`${JSON.stringify(err, null, ' ')}\r\nMoving on.\r\n`);
    } else {
      throw err;
    }
  }
  process.stdout.write(' [done]\n');

  process.stdout.write(`Creating index ${config.defaultTenant.indexName}...\r\n`);
  process.stdout.write(' - Base properties mapping\r\n');
  await request.put(getIndexUrl(), elasticMapping);
  process.stdout.write(' - Custom templates mapping\r\n');
  const templates = await templatesModel.get();
  const templatesMapping = elasticMapFactory.mapping(templates);
  await request.put(`${getIndexUrl()}/_mapping`, templatesMapping);
  process.stdout.write(' [done]\n');
};

const tweakSettingsForPerformmance = async () => {
  process.stdout.write('Tweaking index settings for reindex performance...');
  const result = setReindexSettings(-1, 0, 'async');
  process.stdout.write(' [done]\n');
  return result;
};

const reindex = async () => {
  process.stdout.write('Starting reindex...\r\n');
  const docsIndexed = await indexEntities();
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
};

const processErrors = async err => {
  if (err instanceof IndexError) {
    process.stdout.write('\r\nWarning! Errors found during reindex.\r\n');
  } else {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err, null, ' ');
    errorLog.error(`Uncaught Reindex error.\r\n${errorMsg}\r\nWill exit with (1)\r\n`);
    await endScriptProcedures();
    throw err;
  }
};

process.on('unhandledRejection', error => {
  throw error;
});

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

DB.connect(config.DBHOST, dbAuth).then(async () => {
  const start = Date.now();

  await tenants.run(async () => {
    try {
      await prepareIndex();
      await tweakSettingsForPerformmance();
      await reindex();
    } catch (err) {
      await processErrors(err);
    }
    await endScriptProcedures();
  });

  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
});
