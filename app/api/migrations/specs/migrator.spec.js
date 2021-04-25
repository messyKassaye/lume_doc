import 'jest-extended';

import path from 'path';

import { catchErrors } from '../../utils/jasmineHelpers';
import migration1 from './testMigrations/1-migrationTest';
import migration10 from './testMigrations/10-migrationTest';
import migration2 from './testMigrations/2-migrationTest';
import migrationsModel from '../migrationsModel';
import { migrator } from '../migrator';
import testingDB from '../../utils/testing_db';

describe('migrator', () => {
  let connection;
  beforeAll(async () => {
    connection = await testingDB.connect();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have migrations directory configured', () => {
    expect(migrator.migrationsDir).toBe(path.normalize(`${__dirname}/../migrations/`));
  });

  describe('migrate', () => {
    beforeEach(async () => {
      await testingDB.clear();
      migrator.migrationsDir = path.join(__dirname, 'testMigrations');
      jest.spyOn(migration1, 'up');
      jest.spyOn(migration2, 'up');
      jest.spyOn(migration10, 'up');
    });

    it('should execute all migrations in order', done => {
      migrator
        .migrate(connection.db)
        .then(() => {
          expect(migration1.up).toHaveBeenCalledWith(connection.db);
          expect(migration2.up).toHaveBeenCalledWith(connection.db);
          expect(migration10.up).toHaveBeenCalledWith(connection.db);

          expect(migration1.up).toHaveBeenCalledBefore(migration2.up);
          expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should save migrations run on the db', done => {
      migrator
        .migrate(connection.db)
        .then(() => migrationsModel.get())
        .then(migrations => {
          expect(migrations.map(m => m.delta)).toEqual([1, 2, 10]);
          done();
        });
    });

    it('should only run migrations that had not been run before', done => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      migrationsModel
        .save({ delta: 1 })
        .then(() => migrator.migrate(connection.db))
        .then(() => {
          expect(migration1.up).not.toHaveBeenCalled();
          expect(migration2.up).toHaveBeenCalledWith(connection.db);
          expect(migration10.up).toHaveBeenCalledWith(connection.db);
          expect(migration2.up).toHaveBeenCalledBefore(migration10.up);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should only run migrations that had not been run before', done => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      migrationsModel
        .saveMultiple([{ delta: 1 }, { delta: 2 }])
        .then(() => migrator.migrate(connection.db))
        .then(() => {
          expect(migration1.up).not.toHaveBeenCalled();
          expect(migration2.up).not.toHaveBeenCalled();
          expect(migration10.up).toHaveBeenCalledWith(connection.db);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should not run any migration when the last one has already been run', done => {
      migration1.up.mockClear();
      migration2.up.mockClear();
      migration10.up.mockClear();

      migrationsModel
        .saveMultiple([{ delta: 10 }])
        .then(() => migrator.migrate(connection.db))
        .then(() => {
          expect(migration1.up).not.toHaveBeenCalled();
          expect(migration2.up).not.toHaveBeenCalled();
          expect(migration10.up).not.toHaveBeenCalled();
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
