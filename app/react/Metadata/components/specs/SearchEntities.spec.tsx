import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { SearchEntities, SearchEntitiesProps, SearchEntitiesState } from '../SearchEntities';
import SearchInput from 'app/Layout/SearchInput';
import { sleep } from 'shared/tsUtils';
import api from 'app/utils/api';

import SearchResults from 'app/Connections/components/SearchResults';

describe('SearchEntities', () => {
  let component: ShallowWrapper<SearchEntitiesProps, SearchEntitiesState, SearchEntities>;
  let props: SearchEntitiesProps;

  beforeEach(() => {
    props = {
      onSelect: jasmine.createSpy('onSelect'),
      onFinishSearch: jasmine.createSpy('onFinishedSearch'),
    };
    spyOn(api, 'get').and.returnValue(
      Promise.resolve({
        json: {
          rows: [
            {
              title: 'test',
            },
          ],
        },
      })
    );
  });

  const render = () => {
    component = shallow(<SearchEntities {...props} />);
  };

  describe('search', () => {
    it('should request for the entities matching by title', async () => {
      render();
      component.find(SearchInput).simulate('change', { target: { value: 'test' } });
      await sleep(401);
      expect(api.get).toHaveBeenLastCalledWith('search', {
        data: { fields: ['title'], includeUnpublished: true, searchTerm: 'test' },
        headers: {},
      });
      expect(props.onFinishSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('when clicking a result', () => {
    it('should call onSelect with the entity', async () => {
      render();
      const click = component.find(SearchResults).props().onClick;
      const expectedEntity = { sharedId: '1234', title: '44' };
      click('1234', expectedEntity);
      expect(props.onSelect).toHaveBeenLastCalledWith(expectedEntity);
    });
  });

  describe('when initial search provided', () => {
    it('should should request for the entities after mounting', async () => {
      component = shallow(<SearchEntities {...{ ...props, initialSearchTerm: 'test' }} />);
      expect(api.get).toHaveBeenLastCalledWith('search', {
        data: { fields: ['title'], includeUnpublished: true, searchTerm: 'test' },
        headers: {},
      });
    });
  });
});
