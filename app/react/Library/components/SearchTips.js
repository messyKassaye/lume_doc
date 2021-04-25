import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { t } from 'app/I18N';

export default class SearchTips extends Component {
  constructor(props) {
    super(props);
    this.showSearchTips = this.showSearchTips.bind(this);
  }

  showSearchTips() {
    const searchTipsText = (
      <ul>
        <li>
          {t(
            'System',
            'Search Tips: wildcard',
            'Use an * for wildcard search. Ie: "juris*" will match words  ' +
              'such as jurisdiction, jurisdictional, jurists, jurisprudence, etc.',
            false
          )}
        </li>
        <li>
          {t(
            'System',
            'Search Tips: one char wildcard',
            '? for one character wildcard. Ie: "198?" will match 1980 to 1989 and also 198a, 198b, etc.',
            false
          )}
        </li>
        <li>
          {t(
            'System',
            'Search Tips: exact term',
            'Exact term match by enclosing your search string with quotes. Ie. "Costa Rica"' +
              ' will toss different results compared to Costa Rica without quotes.',
            false
          )}
        </li>
        <li>
          {t(
            'System',
            'Search Tips: proximity',
            '~ for proximity searches. Ie: "the status"~5 will find anything having "the" and' +
              '"status" within a distance of 5 words, such as "the procedural status", "the specific legal status".',
            false
          )}
        </li>
        <li>
          {t(
            'System',
            'Search Tips: boolean',
            'AND, OR and NOT for boolean searches. Ie. "status AND women NOT Nicaragua" will match anything ' +
              'containing both the words status and women, and necessarily not containing the word Nicaragua.',
            false
          )}
        </li>
      </ul>
    );

    this.context.confirm({
      accept: () => {},
      type: 'info',
      title: t('System', 'Narrow down your searches', null, false),
      message: searchTipsText,
      noCancel: true,
    });
  }

  render() {
    return (
      <div className="search-tips" onClick={this.showSearchTips}>
        {t('System', 'Search tips', null, false)}
      </div>
    );
  }
}

SearchTips.contextTypes = {
  confirm: PropTypes.func,
};
