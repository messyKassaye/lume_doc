import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { MenuButtons } from 'app/ContextMenu';
import { MetadataPanelMenu } from '../MetadataPanelMenu';

describe('MetadataPanelMenu', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<MetadataPanelMenu {...props} />);
  };

  describe('when document is not being edited', () => {
    it('should open viewReferencesPanel on click references button', () => {
      props = {
        doc: Immutable.fromJS({ _id: 1 }),
        templates: Immutable.fromJS({ templates: 'tempaltes' }),
        loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      };
      render();

      component.find(MenuButtons.Main).simulate('click');
      expect(props.loadInReduxForm).toHaveBeenCalledWith(
        'documentViewer.docForm',
        props.doc.toJS(),
        props.templates.toJS()
      );
    });
  });

  describe('when document is being edited', () => {
    it('should submit documentForm form', () => {
      props = {
        docForm: { _id: 1 },
        doc: Immutable.fromJS({ _id: 1 }),
        templates: { templates: 'tempaltes' },
        saveDocument: jasmine.createSpy('saveDocument'),
        formState: { dirty: false },
      };
      render();

      const button = component.find(MenuButtons.Main).find('button');
      expect(button.props().form).toBe('metadataForm');
    });

    describe('when form is pristine', () => {
      it('should disable the buttons', () => {
        props = {
          docForm: { _id: 1 },
          formState: { dirty: false },
        };
        render();

        const mainButton = component.find(MenuButtons.Main);
        expect(mainButton.props().disabled).toBe(true);
        const submitButton = component.find(MenuButtons.Main).find('button');
        expect(submitButton.props().disabled).toBe(true);
      });
    });

    describe('when form is dirty', () => {
      it('should not disable the buttons', () => {
        props = {
          docForm: { _id: 1 },
          formState: { dirty: true },
        };
        render();

        const mainButton = component.find(MenuButtons.Main);
        expect(mainButton.props().disabled).toBe(false);
        const submitButton = mainButton.find('button');
        expect(submitButton.props().disabled).toBe(false);
      });
    });
  });
});
