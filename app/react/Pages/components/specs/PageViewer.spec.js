/** @format */

import { fromJS as Immutable } from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';
import MarkdownViewer from 'app/Markdown';

import { PageViewer } from '../PageViewer';
import Script from '../Script';

describe('PageViewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      page: Immutable({
        _id: 1,
        title: 'Page 1',
        metadata: /*non-metadata-object*/ { content: 'MarkdownContent', script: 'JSScript' },
      }),
      itemLists: Immutable([{ item: 'item' }]),
    };
  });

  const render = () => {
    component = shallow(<PageViewer {...props} />, { context });
  };

  describe('render', () => {
    beforeEach(() => {
      render();
    });

    it('should render a MarkdownViewer with the markdown and the items for the lists', () => {
      expect(component.find(MarkdownViewer).props().markdown).toBe('MarkdownContent');
      expect(component.find(MarkdownViewer).props().lists).toEqual([{ item: 'item' }]);
    });

    it('should render the script', () => {
      const scriptElement = component.find(Script);
      expect(scriptElement).toMatchSnapshot();
    });
  });
});
