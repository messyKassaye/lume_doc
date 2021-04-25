import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration missing_full_text', () => {
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
    expect(migration.delta).toBe(11);
  });

  it('should copy fulltext for entities with files from the default language', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb
      .collection('entities')
      .find({ language: 'pt' })
      .toArray();
    expect(entities[0].fullText).toBe('some full text');
  });
});
