/* eslint-disable max-lines */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('Connections', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin', done => {
      nightmare
        .login('admin', 'admin')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  it('should find "Gotham attack" story and open it', done => {
    nightmare
      .librarySearch('Gotham attack')
      .waitFirstDocumentToMatch('Gotham attack')
      .waitToClick(selectors.libraryView.libraryFirstDocumentLink)
      .waitToClick(selectors.entityView.connectionsListView)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add "Event" relationType to "Gotham attack"', done => {
    nightmare.connections
      .edit()
      .connections.addNewRelationship()
      .connections.selectLeftHandRelation(selectors.connections.eventOption, 0)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add new relation group (perpetrator)', done => {
    nightmare.connections
      .selectRightHandRelation(selectors.connections.rightHandPerpetratorOption, 0)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add the perpetrators', done => {
    nightmare.connections
      .sidePanelSearchAndSelect({ searchTerm: 'joker', textOnDom: 'Super Villian' })
      .connections.sidePanelSearchAndSelect('scarecrow')
      .connections.sidePanelSearchAndSelect("Ra's al Ghul")
      .connections.sidePanelSearchAndSelect({ searchTerm: 'robin', textOnDom: 'robin comic character' })
      .connections.sidePanelSearchAndSelect('Talia al Ghul')
      .connections.sidePanelSearchAndSelect('Cluemaster Wikipedia')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add new relation group (heros)', done => {
    nightmare.connections
      .selectRightHandRelation(selectors.connections.rightHandHerosOption, 1)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add the heros', done => {
    nightmare.connections
      .sidePanelSearchAndSelect({ searchTerm: 'batman', textOnDom: 'batman comic character' })
      .connections.sidePanelSearchAndSelect('alfred pennyworth')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should save the relations', done => {
    nightmare.connections
      .save()
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should move robin to the heroes', done => {
    nightmare.connections
      .edit()
      .connections.moveRelationship('robin', 0)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should save the relations', done => {
    nightmare.connections
      .save()
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should render the relations properly after a save', done => {
    nightmare.connections
      .getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Event: {
            Heros: ['Batman', 'Robin', 'Alfred Pennyworth'],
            Perpetrator: [
              'Scarecrow',
              'Joker',
              'Talia al Ghul',
              "Ra's al Ghul",
              'Cluemaster Wikipedia',
            ],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should render the relations properly after a reload', done => {
    nightmare
      .refresh()
      .waitToClick(selectors.entityView.connectionsListView)
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Event: {
            Heros: ['Batman', 'Robin', 'Alfred Pennyworth'],
            Perpetrator: [
              'Scarecrow',
              'Joker',
              'Talia al Ghul',
              "Ra's al Ghul",
              'Cluemaster Wikipedia',
            ],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should fix the perpetrators, removing Cluemaster (was not there) and do an undo remove of talia', done => {
    nightmare.connections
      .edit()
      .connections.removeRelation('talia')
      .connections.removeRelation('cluemaster')
      .connections.undoRemoveRelation('talia')
      .connections.save()
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Event: {
            Heros: ['Batman', 'Robin', 'Alfred Pennyworth'],
            Perpetrator: ['Scarecrow', 'Joker', 'Talia al Ghul', "Ra's al Ghul"],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add new relationship "Interpretation"', done => {
    nightmare.connections
      .edit()
      .connections.addNewRelationship()
      .connections.selectLeftHandRelation(selectors.connections.eventOption, 1)
      .connections.selectRightHandRelation(selectors.connections.interpretationOption, 3)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should add the interpretations', done => {
    nightmare.connections
      .sidePanelSearchAndSelect('batman begins')
      .connections.sidePanelSearchAndSelect('batman eternal')
      .connections.sidePanelSearchAndSelect('batman arkham city')
      .connections.save()
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should render the relations properly after a reload', done => {
    nightmare
      .refresh()
      .waitToClick(selectors.entityView.connectionsListView)
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Event: {
            Heros: ['Batman', 'Robin', 'Alfred Pennyworth'],
            Perpetrator: ['Scarecrow', 'Joker', 'Talia al Ghul', "Ra's al Ghul"],
          },
          Event1: {
            Interpretation: ['Batman Eternal', 'Batman Arkham City', 'Batman Begins'],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should render relations properly from "Batman Begins" side', done => {
    nightmare.connections
      .goTo('batman begins')
      .waitToClick(selectors.connections.sidePanelViewEntityLink)
      .waitToClick(selectors.connections.documentViewerConnectionsTab)
      .connections.waitForRelationHubs()
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Interpretation: {
            Event: ['Gotham attack'],
            Interpretation: ['Batman Eternal', 'Batman Arkham City'],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should remove Interpretation group', done => {
    nightmare.connections
      .edit()
      .connections.removeRelationGroup('Interpretation')
      .connections.save()
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Interpretation: { Event: ['Gotham attack'] },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should go to "gotham attack" and check the new interpretations', done => {
    nightmare.connections
      .goTo('Gotham attack')
      .waitToClick(selectors.connections.sidePanelViewEntityLink)
      .waitToClick(selectors.entityView.connectionsListView)
      .connections.waitForRelationHubs()
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Event: {
            Heros: ['Batman', 'Robin', 'Alfred Pennyworth'],
            Perpetrator: ['Scarecrow', 'Joker', 'Talia al Ghul', "Ra's al Ghul"],
          },
          Event1: {
            Interpretation: ['Batman Begins'],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should remove perpetrator and interpretations and undo the remove on perpetrator', done => {
    nightmare.connections
      .edit()
      .connections.removeRelationGroup('Perpetrator')
      .connections.removeRelationGroup('Interpretation')
      .connections.undoRemoveRelationGroup('Perpetrator')
      .connections.save()
      .connections.getRelationsObjet()
      .then(relations => {
        expect(relations).toEqual({
          Event: {
            Heros: ['Batman', 'Robin', 'Alfred Pennyworth'],
            Perpetrator: ['Scarecrow', 'Joker', 'Talia al Ghul', "Ra's al Ghul"],
          },
        });
      })
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  describe('when sorting by title a-z', () => {
    it('should sort the connected entitites a to z', done => {
      nightmare.connections
        .sortBy('Title (A-Z)')
        .connections.getRelationsObjet()
        .then(relations => {
          expect(relations).toEqual({
            Event: {
              Heros: ['Alfred Pennyworth', 'Batman', 'Robin'],
              Perpetrator: ['Joker', "Ra's al Ghul", 'Scarecrow', 'Talia al Ghul'],
            },
          });
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('when sorting by title z-a', () => {
    it('should sort the connected entitites z to a', done => {
      nightmare.connections
        .sortBy('Title (Z-A)')
        .connections.getRelationsObjet()
        .then(relations => {
          expect(relations).toEqual({
            Event: {
              Perpetrator: ['Talia al Ghul', 'Scarecrow', "Ra's al Ghul", 'Joker'],
              Heros: ['Robin', 'Batman', 'Alfred Pennyworth'],
            },
          });
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('when searching', () => {
    it('should filter and show search snippets', done => {
      nightmare.connections
        .search('talia')
        .connections.getRelationsObjet()
        .then(relations => {
          expect(relations).toEqual({
            Event: {
              Perpetrator: ['Talia al Ghul', "Ra's al Ghul"],
              Heros: ['Robin', 'Batman'],
            },
          });
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
