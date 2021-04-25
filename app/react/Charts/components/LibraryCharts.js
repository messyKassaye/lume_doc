import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t } from 'app/I18N';

import { parseWithAggregations } from 'app/Library/helpers/libraryFilters';

import LibraryChart from './LibraryChart';
import arrayUtils from '../utils/arrayUtils';

function translateOptions(_property) {
  const property = _property;
  property.options = property.options.map(_option => {
    const option = _option;
    option.label = t(property.content, option.label, null, false);
    return option;
  });
  return property;
}

function sortFields(_field) {
  const field = _field;
  field.options = arrayUtils.sortValues(field.options);
  return field;
}

export class LibraryCharts extends Component {
  itemResults(item) {
    const { aggregations } = this;
    const buckets =
      aggregations.all && aggregations.all.types ? aggregations.all.types.buckets : [];
    const found = buckets.find(agg => agg.key === item.id);

    if (found) {
      return found.filtered.doc_count;
    }

    if (item.items) {
      return item.items.reduce((result, _item) => result + this.itemResults(_item), 0);
    }

    return 0;
  }

  conformDocumentTypesToFields() {
    let items = this.props.collection.toJS().filters || [];

    if (!items.length || this.props.storeKey === 'uploads') {
      items = this.props.templates.toJS().map(tpl => ({ id: tpl._id, name: tpl.name }));
    }

    if (this.props.storeKey === 'uploads') {
      items.unshift({ id: 'missing', name: t('System', 'No type') });
    }

    const fields = [
      {
        options: items.map(item => ({
          label: t(item.id, item.name),
          results: this.itemResults(item),
        })),
        label: t('System', 'Document and entity types'),
      },
    ];

    return fields;
  }

  render() {
    let fields = [];

    if (this.props.aggregations) {
      this.aggregations = this.props.aggregations.toJS();

      if (this.props.fields.size) {
        fields = parseWithAggregations(this.props.fields.toJS(), this.aggregations)
          .filter(
            field =>
              (field.type === 'select' || field.type === 'multiselect') &&
              field.options &&
              field.options.length
          )
          .map(translateOptions)
          .map(sortFields);
      }

      fields = fields.length ? fields : this.conformDocumentTypesToFields();
    }

    return (
      <div className="documents-list">
        <div className="main-wrapper">
          <div className="item-group item-group-charts">
            {fields.map((field, index) => (
              <LibraryChart
                key={index}
                options={field.options}
                label={t(this.props.translationContext, field.label)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

LibraryCharts.propTypes = {
  aggregations: PropTypes.object,
  fields: PropTypes.object,
  collection: PropTypes.object,
  templates: PropTypes.object,
  storeKey: PropTypes.string,
  translationContext: PropTypes.string,
};

export function mapStateToProps(state, props) {
  const documentTypesExist = props.storeKey && state[props.storeKey].filters.get('documentTypes');

  return {
    aggregations: props.storeKey ? state[props.storeKey].aggregations : null,
    fields: props.storeKey ? state[props.storeKey].filters.get('properties') : null,
    collection: state.settings.collection,
    templates: state.templates,
    translationContext: documentTypesExist
      ? state[props.storeKey].filters.getIn(['documentTypes', 0])
      : null,
  };
}

export default connect(mapStateToProps)(LibraryCharts);
