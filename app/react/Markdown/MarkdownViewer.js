import PropTypes from 'prop-types';
import React, { Component } from 'react';
import rison from 'rison-node';

import CustomComponents from './components';
import CustomHookComponents from './CustomHooks';

import markdownToReact from './markdownToReact';

class MarkdownViewer extends Component {
  static errorHtml(index, message) {
    return (
      <p key={index} className="error">
        <br />
        <strong>
          <i>Custom component markup error: unsuported values! Please check your configuration</i>
        </strong>
        <br />
        {message}
        <br />
      </p>
    );
  }

  static customHook(config, index) {
    const props = rison.decode(config);
    if (!CustomHookComponents[props.component]) {
      throw new Error('Invalid  component');
    }
    const Element = CustomHookComponents[props.component];
    return <Element {...props} key={index} />;
  }

  inlineComponent(type, config, index) {
    const { compact } = this.props;
    let result;
    if (type === 'list') {
      result = this.list(config, index);
    }

    if (type === 'link') {
      result = <CustomComponents.MarkdownLink {...rison.decode(config)} key={index} />;
    }

    if (type === 'searchbox') {
      result = <CustomComponents.SearchBox {...rison.decode(config)} key={index} />;
    }

    if (['vimeo', 'youtube', 'media'].includes(type)) {
      result = <CustomComponents.MarkdownMedia key={index} config={config} compact={compact} />;
    }

    if (type === 'customhook') {
      result = MarkdownViewer.customHook(config, index);
    }
    return result;
  }

  customComponent(type, config, index, children) {
    try {
      if (typeof type === 'function') {
        const Element = type;
        return (
          <Element {...config} key={index}>
            {children}
          </Element>
        );
      }

      if (type) {
        return this.inlineComponent(type, config, index);
      }
    } catch (error) {
      return MarkdownViewer.errorHtml(index, error.message);
    }

    return false;
  }

  list(_config, index) {
    const listData = this.props.lists[this.renderedLists] || {};
    const output = (
      <CustomComponents.ItemList
        key={index}
        link={`/library/${listData.params}`}
        items={listData.items}
        options={listData.options}
      />
    );
    this.renderedLists += 1;
    return output;
  }

  render() {
    this.renderedLists = 0;

    const ReactFromMarkdown = markdownToReact(
      this.props.markdown,
      this.customComponent.bind(this),
      this.props.html
    );

    if (!ReactFromMarkdown) {
      return false;
    }

    return <div className="markdown-viewer">{ReactFromMarkdown}</div>;
  }
}

MarkdownViewer.defaultProps = {
  lists: [],
  markdown: '',
  html: false,
  compact: false,
};

MarkdownViewer.propTypes = {
  markdown: PropTypes.string,
  lists: PropTypes.arrayOf(PropTypes.object),
  html: PropTypes.bool,
  compact: PropTypes.bool,
};

export default MarkdownViewer;
