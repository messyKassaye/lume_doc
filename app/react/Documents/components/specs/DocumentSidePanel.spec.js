import React from 'react';
import { shallow } from 'enzyme';
import Immutable, { fromJS } from 'immutable';
import { Tabs } from 'react-tabs-redux';

import { ConnectionsGroups } from 'app/ConnectionsList';
import SidePanel from 'app/Layout/SidePanel';
import Connections from 'app/Viewer/components/ConnectionsList';
import * as viewerModule from 'app/Viewer';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

import ShowToc from '../ShowToc';
import { DocumentSidePanel, mapStateToProps } from '../DocumentSidePanel';

jest.mock('shared/entityDefaultDocument');

describe('DocumentSidePanel', () => {
  let component;
  let props;
  const context = {
    confirm: jasmine.createSpy('confirm'),
  };

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({ metadata: [], attachments: [], type: 'document', file: {} }),
      rawDoc: fromJS({}),
      templates: Immutable.fromJS([]),
      showModal: jasmine.createSpy('showModal'),
      openPanel: jasmine.createSpy('openPanel'),
      startNewConnection: jasmine.createSpy('startNewConnection'),
      showTab: jasmine.createSpy('showTab'),
      closePanel: jasmine.createSpy('closePanel'),
      deleteDocument: jasmine.createSpy('deleteDocument'),
      resetForm: jasmine.createSpy('resetForm'),
      excludeConnectionsTab: true,
      storeKey: 'library',
      references: Immutable.fromJS(['reference']),
      connections: Immutable.fromJS(['connections']),
      formPath: 'formPath',
      connectionsGroups: Immutable.fromJS([
        { templates: [{ count: 1 }, { count: 2 }] },
        { templates: [{ count: 3 }, { count: 4 }] },
      ]),
      open: true,
      defaultLanguage: 'es',
    };
  });

  const render = () => {
    component = shallow(<DocumentSidePanel {...props} />, { context });
  };

  it('should have default props values assigned', () => {
    render();
    expect(component.instance().props.tocFormComponent()).toBe(false);
    expect(component.instance().props.EntityForm()).toBe(false);
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();
      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('connections', () => {
    it('should render 2 connections sections, for connections and references', () => {
      expect(
        component
          .find(Connections)
          .at(0)
          .props().references
      ).toEqual(props.references);
      expect(component.find(ConnectionsGroups).length).toBe(1);
    });
  });

  describe('Tabs', () => {
    it('should set tab in props as selected', () => {
      props.tab = 'selected-tab';
      render();
      expect(
        component
          .find(Tabs)
          .at(0)
          .props().selectedTab
      ).toBe('selected-tab');
    });

    describe('when doc passed is an entity', () => {
      it('should set metadata as selected if tab is toc', () => {
        props.doc = Immutable.fromJS({ metadata: [], attachments: [], type: 'entity' });
        props.tab = 'toc';
        render();
        expect(
          component
            .find(Tabs)
            .at(0)
            .props().selectedTab
        ).toBe('metadata');
      });
      it('should set metadata as selected if tab is references', () => {
        props.doc = Immutable.fromJS({ metadata: [], attachments: [], type: 'entity' });
        props.tab = 'references';
        render();
        expect(
          component
            .find(Tabs)
            .at(0)
            .props().selectedTab
        ).toBe('metadata');
      });
      it('should pass to entityForm the initial templateId', () => {
        props.doc = Immutable.fromJS({ type: 'entity', template: 'templateId' });
        props.docBeingEdited = true;
        render();
        expect(component.find('EntityForm').props().initialTemplateId).toBe('templateId');
      });
    });

    describe('when doc passed is a document', () => {
      it('should pass to documentForm the initial templateId', () => {
        props.doc = Immutable.fromJS({
          type: 'document',
          template: 'templateId',
          documents: [{ filename: 'file1' }],
        });
        props.docBeingEdited = true;
        render();
        expect(component.find('EntityForm').props().initialTemplateId).toBe('templateId');
      });
    });

    describe('when doc passed has toc', () => {
      const toc = ['title1', 'title2', 'title3'];
      function expectToCValuesAreTheProvidedInProps() {
        props.tab = 'toc';
        render();
        expect(component.find(ShowToc).props().toc).toEqual(toc);
      }
      it('should set toc of the loaded file if doc is a new entity', () => {
        props.doc = Immutable.fromJS({ metadata: [], attachments: [], type: 'entity' });
        props.file = { toc, pdfInfo: {} };
        expectToCValuesAreTheProvidedInProps();
      });
      it('should set the toc of the default document if doc is a loaded entity', () => {
        const documents = [{ toc }];
        entityDefaultDocument.mockReturnValue(documents[0]);
        props.doc = Immutable.fromJS({ documents, attachments: [], type: 'entity' });
        expectToCValuesAreTheProvidedInProps();
      });
      it('should set the toc of the defaultDoc of document if doc is not an entity', () => {
        props.doc = Immutable.fromJS({
          type: 'document',
          defaultDoc: { toc },
          documents: [{ filename: 'file1' }],
        });
        expectToCValuesAreTheProvidedInProps();
      });
    });
  });

  describe('close', () => {
    describe('when form is dirty', () => {
      it('should confirm', () => {
        props.formDirty = true;
        render();
        component.find('.close-modal').simulate('click');
        expect(context.confirm).toHaveBeenCalled();
      });
    });

    describe('when form is not dirty', () => {
      it('should close panel and reset form', () => {
        props.closePanel = jasmine.createSpy('closePanel');
        props.resetForm = jasmine.createSpy('resetForm');
        props.formDirty = false;
        props.docBeingEdited = true;
        props.formPath = 'formPath';
        render();
        component.find('.close-modal').simulate('click');
        expect(props.closePanel).toHaveBeenCalled();
        expect(props.resetForm).toHaveBeenCalledWith('formPath');
      });
    });
  });

  describe('mapStateToProps', () => {
    let state;
    const languages = [
      { key: 'en', label: 'English' },
      { key: 'pr', label: 'Português', default: true },
    ];

    beforeEach(() => {
      state = {
        documentViewer: { targetDoc: Immutable.fromJS({ _id: null }) },
        relationships: { list: { connectionsGroups: 'connectionsGroups' } },
        relationTypes: Immutable.fromJS(['a', 'b']),
        settings: { collection: Immutable.fromJS({ languages }) },
        library: { sidepanel: { metadata: {} } },
      };
      spyOn(viewerModule.selectors, 'parseReferences').and.callFake(
        (doc, refs) => `Parsed ${doc} refs: ${refs}`
      );
      spyOn(viewerModule.selectors, 'selectReferences').and.callFake(
        fakeState => `References selector used ${fakeState === state ? 'correctly' : 'incorrectly'}`
      );
      spyOn(viewerModule.selectors, 'selectTargetReferences').and.callFake(
        fakeState =>
          `Target references selector used ${fakeState === state ? 'correctly' : 'incorrectly'}`
      );
    });

    it('should map parsed references from ownProps if present and set the excludeConnectionsTab to true', () => {
      const ownProps = { doc: 'fullDocData', references: 'allRefs', storeKey: 'library' };
      expect(mapStateToProps(state, ownProps).references).toBe('Parsed fullDocData refs: allRefs');
      expect(mapStateToProps(state, ownProps).excludeConnectionsTab).toBe(true);
    });

    it('should map selected references from viewer when no ownProps and not targetDoc', () => {
      const ownProps = { storeKey: 'library' };
      expect(mapStateToProps(state, ownProps).references).toBe(
        'References selector used correctly'
      );
      expect(mapStateToProps(state, ownProps).excludeConnectionsTab).toBe(false);
    });

    it('should map selected target references from viewer when no ownProps and targetDoc', () => {
      const ownProps = { storeKey: 'library' };
      state.documentViewer.targetDoc = Immutable.fromJS({ _id: 'targetDocId' });
      expect(mapStateToProps(state, ownProps).references).toBe(
        'Target references selector used correctly'
      );
      expect(mapStateToProps(state, ownProps).excludeConnectionsTab).toBe(false);
    });

    it('should map connectionsGroups', () => {
      const ownProps = { storeKey: 'library' };
      expect(mapStateToProps(state, ownProps).connectionsGroups).toBe('connectionsGroups');
    });

    it('should map default language', () => {
      const ownProps = { storeKey: 'library' };
      expect(mapStateToProps(state, ownProps).defaultLanguage).toBe('pr');
    });
  });
});
