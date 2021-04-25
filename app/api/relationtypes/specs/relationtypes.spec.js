import { catchErrors } from 'api/utils/jasmineHelpers';
import translations from 'api/i18n/translations';

import db from 'api/utils/testing_db';
import relationtypes from '../relationtypes.js';
import fixtures, { canNotBeDeleted, against } from './fixtures.js';

describe('relationtypes', () => {
  beforeEach(done => {
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('get()', () => {
    it('should return all the relationtypes in the database', done => {
      relationtypes
        .get()
        .then(result => {
          expect(result.length).toBe(3);
          expect(result[0].name).toBe('Against');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('getById()', () => {
    it('should return the relationtype with the id', done => {
      relationtypes
        .getById(against)
        .then(result => {
          expect(result.name).toBe('Against');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('save()', () => {
    beforeEach(() => {
      spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
      spyOn(translations, 'updateContext').and.returnValue(Promise.resolve());
    });

    it('should generate names and ids for the properties', done => {
      relationtypes
        .save({ name: 'Indiferent', properties: [{ label: 'Property one' }] })
        .then(result => {
          expect(result.properties[0].name).toBe('property_one');
          expect(result.properties[0]._id).toBeDefined();
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when the relation type did not exist', () => {
      it('should create a new one and return it', done => {
        relationtypes
          .save({ name: 'Indiferent', properties: [] })
          .then(result => {
            expect(result.name).toBe('Indiferent');
            done();
          })
          .catch(catchErrors(done));
      });

      it('should create a new translation for it', done => {
        relationtypes
          .save({ name: 'Indiferent', properties: [] })
          .then(response => {
            expect(translations.addContext).toHaveBeenCalledWith(
              response._id,
              'Indiferent',
              { Indiferent: 'Indiferent' },
              'Connection'
            );
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('when the relation type exists', () => {
      it('should update it', done => {
        relationtypes
          .getById(against)
          .then(relationtype => {
            relationtype.name = 'Not that Against';
            return relationtypes.save(relationtype);
          })
          .then(result => {
            expect(result.name).toBe('Not that Against');
            done();
          })
          .catch(catchErrors(done));
      });

      it('should update the translation for it', done => {
        relationtypes
          .getById(against)
          .then(relationtype => {
            relationtype.name = 'Pro';
            return relationtypes.save(relationtype);
          })
          .then(response => {
            expect(translations.updateContext).toHaveBeenCalledWith(
              response._id,
              'Pro',
              { Against: 'Pro' },
              [],
              { Pro: 'Pro' },
              'Connection'
            );
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('when its duplicated', () => {
      it('should return an error', done => {
        const relationtype = { name: 'Against', properties: [] };
        return relationtypes
          .save(relationtype)
          .then(catchErrors(done))
          .catch(error => {
            expect(error).toBe('duplicated_entry');
            done();
          });
      });
    });

    describe('delete()', () => {
      beforeEach(() => {
        spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());
      });

      it('should remove it from the database and return true', done => {
        relationtypes
          .delete(against)
          .then(result => {
            expect(result).toBe(true);
            return relationtypes.getById(against);
          })
          .then(response => {
            expect(response).toBe(null);
            done();
          });
      });

      it('should remove the translation', done => {
        relationtypes.delete(against).then(() => {
          expect(translations.deleteContext).toHaveBeenCalledWith(against);
          done();
        });
      });

      it('when its been used should not delete it and return false', done => {
        relationtypes
          .delete(canNotBeDeleted)
          .then(result => {
            expect(result).toBe(false);
            return relationtypes.getById(canNotBeDeleted);
          })
          .then(result => {
            expect(result._id.equals(canNotBeDeleted)).toBe(true);
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });
});
