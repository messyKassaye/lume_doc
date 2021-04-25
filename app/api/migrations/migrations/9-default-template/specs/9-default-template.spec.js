import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration default-template', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(9);
  });

  it('should set a default template', async () => {
    await migration.up(testingDB.mongodb);
    const templates = await testingDB.mongodb
      .collection('templates')
      .find()
      .toArray();
    expect(templates[0].isEntity).not.toBeDefined();
    expect(templates[1].isEntity).not.toBeDefined();
    expect(templates[0].default).toBe(true);
  });
});
