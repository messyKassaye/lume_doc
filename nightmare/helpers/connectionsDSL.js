/* eslint-disable max-lines */
// eslint-disable-next-line import/no-extraneous-dependencies
import Nightmare from 'nightmare';
import selectors from './selectors.js';

Nightmare.action('connections', {
  waitForRelationHubs(done) {
    this.wait('.relationshipsHub').then(() => {
      done();
    });
  },
  sortBy(orderByText, done) {
    this.waitToClick(selectors.connections.sortMenu)
      .evaluate(sortBy => {
        const helpers = document.__helpers;
        const sortOptions = helpers.querySelectorAll(
          '.sort-buttons > div.Dropdown.order-by.is-active .Dropdown-option a'
        );

        sortOptions.forEach(option => {
          if (option.innerText.toLowerCase().trim() === sortBy.toLowerCase().trim()) {
            option.click();
          }
        });
      }, orderByText)
      .wait(300)
      .then(() => {
        done();
      });
  },
  edit(done) {
    this.waitToClick(selectors.connections.editButton)
      .then(() => {
        done();
      })
      .catch(done);
  },
  save(done) {
    this.waitToClick(selectors.connections.saveButton)
      .wait(() => {
        const element = document.querySelector('.removeHub');
        return !element;
      })
      .connections.waitForSave()
      .then(() => {
        done();
      })
      .catch(done);
  },
  addNewRelationship(done) {
    this.waitToClick(selectors.connections.newRelationshipButton)
      .then(() => {
        done();
      })
      .catch(done);
  },
  selectRelationOption(optionSelector, relationsSelector, relationshipNumber, done) {
    this.wait(
      (selector, selectorForRelations, number) => {
        const helpers = document.__helpers;
        const relation = helpers.querySelectorAll(selectorForRelations)[number];
        const option = relation.querySelector(selector);
        if (option) {
          option.click();
          return true;
        }
        return false;
      },
      optionSelector,
      relationsSelector,
      relationshipNumber
    )
      .then(() => {
        done();
      })
      .catch(done);
  },
  selectRightHandRelation(optionSelector, number, done) {
    this.evaluate(
      (_option, relationshipNumber) => {
        const helpers = document.__helpers;
        const relation = helpers.querySelectorAll(
          'div.rightRelationshipsTypeGroup > div.rightRelationshipType'
        )[relationshipNumber];
        helpers.querySelector('button', relation).click();
      },
      optionSelector,
      number
    )
      .connections.selectRelationOption(
        optionSelector,
        'div.rightRelationshipsTypeGroup > div.rightRelationshipType',
        number
      )
      .then(() => {
        done();
      })
      .catch(done);
  },
  clickMoveRelationButton(matchingTitle, done) {
    this.evaluate_now(
      term => {
        const helpers = document.__helpers;
        const relations = helpers.querySelectorAll('.rightRelationship');
        relations.forEach(relation => {
          if (relation.innerText.toLowerCase().match(term.toLowerCase())) {
            helpers.querySelector('.moveEntity button', relation).click();
          }
        });
      },
      done,
      matchingTitle
    ).catch(done);
  },
  clickMoveToGroupButton(groupIndex, done) {
    this.evaluate_now(
      index => {
        const helpers = document.__helpers;
        helpers.querySelectorAll('.insertEntities button')[index].click();
      },
      done,
      groupIndex
    ).catch(done);
  },
  moveRelationship(matchingTitle, relationGtoupIndex, done) {
    this.connections
      .clickMoveRelationButton(matchingTitle)
      .connections.clickMoveToGroupButton(relationGtoupIndex)
      .then(() => {
        done();
      })
      .catch(done);
  },
  selectLeftHandRelation(optionSelector, number, done) {
    this.evaluate(
      (_option, relationshipNumber) => {
        const helpers = document.__helpers;
        const relation = helpers.querySelectorAll('div.leftRelationshipType')[relationshipNumber];
        helpers.querySelector('button', relation).click();
      },
      optionSelector,
      number
    )
      .connections.selectRelationOption(optionSelector, 'div.leftRelationshipType', number)
      .then(() => {
        done();
      })
      .catch(done);
  },
  search(term, done) {
    this.write(selectors.connections.searchInput, term)
      .type(selectors.connections.searchInput, '\u000d')
      .wait(300)
      .then(() => {
        done();
      })
      .catch(done);
  },
  sidePanelSearchAndSelect(term, done) {
    const searchTerm = term.searchTerm || term;
    const textOnDom = term.textOnDom || term;
    this.connections
      .sidepanelSearch(searchTerm)
      .connections.sidepanelSelect(textOnDom)
      .then(() => {
        done();
      })
      .catch(done);
  },
  sidepanelSearch(term, done) {
    this.clearInput(selectors.connections.sidePanelSearchInput)
      .write(selectors.connections.sidePanelSearchInput, `"${term}"`)
      .then(() => {
        done();
      })
      .catch(done);
  },

  sidepanelSelect(matchingTitle, done) {
    this.wait(toMatch => {
      const elements = document.querySelectorAll(
        '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div > div > div.item'
      );

      let found;
      elements.forEach(element => {
        if (found) {
          return;
        }
        if (element.innerText.replace(/(\r\n|\n|\r)/gm, ' ').match(new RegExp(toMatch, 'i'))) {
          found = element;
        }
      });

      if (found) {
        found.click();
        return true;
      }

      return false;
    }, matchingTitle)
      .then(() => {
        done();
      })
      .catch(done);
  },
  clickRemoveRelationButton(matchingTitle, done) {
    this.evaluate_now(
      term => {
        const helpers = document.__helpers;
        const relations = helpers.querySelectorAll('.rightRelationship');
        relations.forEach(relation => {
          if (relation.innerText.toLowerCase().match(term.toLowerCase())) {
            helpers.querySelector('.removeEntity button', relation).click();
          }
        });
      },
      done,
      matchingTitle
    ).catch(done);
  },
  clickRemoveRelationGroupButton(matchingTitle, done) {
    this.evaluate_now(
      term => {
        const helpers = document.__helpers;
        const relations = helpers.querySelectorAll('.rightRelationshipType');
        relations.forEach(relation => {
          if (relation.innerText.toLowerCase().match(term.toLowerCase())) {
            relation.nextSibling.querySelector('button').click();
          }
        });
      },
      done,
      matchingTitle
    ).catch(done);
  },
  removeRelationGroup(matchingTitle, done) {
    this.connections
      .clickRemoveRelationGroupButton(matchingTitle)
      .then(() => {
        done();
      })
      .catch(done);
  },
  undoRemoveRelationGroup(matchingTitle, done) {
    this.connections
      .clickRemoveRelationGroupButton(matchingTitle)
      .then(() => {
        done();
      })
      .catch(done);
  },
  removeRelation(matchingTitle, done) {
    this.connections
      .clickRemoveRelationButton(matchingTitle)
      .then(() => {
        done();
      })
      .catch(done);
  },
  undoRemoveRelation(matchingTitle, done) {
    this.connections
      .clickRemoveRelationButton(matchingTitle)
      .then(() => {
        done();
      })
      .catch(done);
  },
  goTo(matchingTitle, done) {
    this.evaluate(title => {
      const helpers = document.__helpers;
      const items = helpers.querySelectorAll('.relationships-graph .item-name');

      items.forEach(item => {
        if (item.innerText.toLowerCase() === title.toLowerCase()) {
          item.click();
        }
      });
    }, matchingTitle)
      .then(() => {
        done();
      })
      .catch(done);
  },
  waitForSave(done) {
    this.wait(() => {
      const deleteButtons = document.querySelectorAll('.relationships-removeIcon');
      return deleteButtons.length === 0;
    })
      .wait('.leftRelationshipType .rw-input')
      .then(() => {
        done();
      })
      .catch(done);
  },

  getRelationsObjet(done) {
    this.evaluate_now(() => {
      const helpers = document.__helpers;
      const result = {};
      const hubs = helpers.querySelectorAll('.relationshipsHub');

      hubs.forEach((hub, index) => {
        let hubName = helpers.querySelector('.leftRelationshipType .rw-input', hub).innerText;
        if (result[hubName]) {
          hubName += index;
        }
        result[hubName] = {};

        const rightHandRelations = helpers.querySelectorAll('.rightRelationshipsTypeGroup', hub);
        rightHandRelations.forEach(relation => {
          const relationName = helpers.querySelector('.rw-input', relation).innerText;
          result[hubName][relationName] = [];
          relation.querySelectorAll('.item-name').forEach(item => {
            result[hubName][relationName].push(item.innerText);
          });
        });
      });
      return result;
    }, done);
  },
});
