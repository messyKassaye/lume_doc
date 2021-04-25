export default {
  filterBaseProperties: data => {
    const properties = [
      '_id',
      'language',
      'metadata',
      'suggestedMetadata',
      'sharedId',
      'template',
      'title',
      'icon',
      'type',
    ];
    return Object.assign({}, ...properties.map(p => ({ [p]: data[p] })));
  },
};
