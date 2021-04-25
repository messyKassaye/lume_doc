/* eslint-disable max-lines */
import moment from 'moment';
import {
  formatters as typeFormatters,
  formatFile,
  formatDate,
  formatAttachment,
  FormatterFunction,
  formatDocuments,
  formatAttachments,
} from '../typeFormatters';

let formatFn: any;
let unixFn: any;

const formatDateFn = () => {
  let sec = 0;
  const next = () => {
    sec += 1;
    return `${sec}`;
  };
  return next;
};

const mockMoment = () => {
  formatFn = jest.fn(formatDateFn());
  unixFn = jest.fn(() => ({
    utc: () => ({
      format: formatFn,
    }),
  }));
  moment.unix = unixFn;
};

const originalMomentUnix = moment.unix;
afterAll(() => {
  moment.unix = originalMomentUnix;
});

beforeEach(() => {
  mockMoment();
});

afterEach(() => {
  jest.clearAllMocks();
});

const testEmptyField = (formatter: FormatterFunction) => {
  const field: any[] = [];
  const value = formatter(field, {});
  expect(value).toBe('');

  const nullField: any[] = [
    {
      value: null,
    },
  ];
  const nullValue = formatter(nullField, {});
  expect(nullValue).toBe('');
};

const testSimple = (value: any, formatter: FormatterFunction, expected: any) => {
  const field = [{ value }];
  const result = formatter(field, {});
  expect(result).toBe(expected);
  testEmptyField(formatter);
};

describe('csvExporter typeFormatters', () => {
  describe('SELECTS', () => {
    it('should return the correct SELECT value', () => {
      const field = [{ label: 'label1', value: 'value1' }];
      const value = typeFormatters.select(field, {});
      expect(value).toBe('label1');
      testEmptyField(typeFormatters.select);
    });

    it('should return the correct MULTISELECT value', () => {
      const singleField = [{ label: 'label1', value: 'value1' }];
      const multipleField = [
        { label: 'label1', value: 'value1' },
        { label: 'label2', value: 'value2' },
      ];

      const singleValue = typeFormatters.multiselect(singleField, {});
      const multipleValue = typeFormatters.multiselect(multipleField, {});

      expect(singleValue).toBe('label1');
      expect(multipleValue).toBe('label1|label2');
      testEmptyField(typeFormatters.multiselect);
    });
  });

  describe('DATES', () => {
    it('should return the correct DATE value', () => {
      const field = [{ value: 1585851003 }];

      const value = typeFormatters.date(field, {});

      expect(value).toBe('1');
      expect(moment.unix).toHaveBeenLastCalledWith(1585851003);
      expect(formatFn).toHaveBeenLastCalledWith('YYYY-MM-DD');

      testEmptyField(typeFormatters.date);
    });

    it('should return the correct MULTIDATE value', () => {
      const multipleField = [{ value: 1585851003 }, { value: 1585915200 }];

      const multipleValue = typeFormatters.multidate(multipleField, {});

      expect(multipleValue).toBe('1|2');
      expect(unixFn).toHaveBeenCalledTimes(2);
      expect(formatFn).toHaveBeenCalledTimes(2);

      testEmptyField(typeFormatters.multidate);
    });

    it('should return the correct DATERANGE value', () => {
      const field = [{ value: { from: 1585851003, to: 1585915200 } }];

      const value = typeFormatters.daterange(field, {});

      expect(value).toBe('1~2');
      expect(moment.unix).toHaveBeenCalledTimes(2);
      expect(formatFn).toHaveBeenCalledTimes(2);

      testEmptyField(typeFormatters.daterange);
    });

    it('should return the correct MULTIDATERANGE value', () => {
      const multipleField = [
        { value: { from: 1585851003, to: 1585915200 } },
        { value: { from: 1585851003, to: 1585915200 } },
      ];

      const multipleValue = typeFormatters.multidaterange(multipleField, {});

      expect(multipleValue).toBe('1~2|3~4');
      expect(unixFn).toHaveBeenCalledTimes(4);
      expect(formatFn).toHaveBeenCalledTimes(4);

      testEmptyField(typeFormatters.multidaterange);
    });
  });

  describe('URLs', () => {
    it('should return the correct IMAGE url', () => {
      testSimple('image.jpg', typeFormatters.image, 'image.jpg');
    });

    it('should return the correct LINK value', () => {
      testSimple({ label: 'UWAZI', url: 'uwazi.io' }, typeFormatters.link, 'UWAZI|uwazi.io');
    });

    it('should return the correct MEDIA value', () => {
      testSimple('media_url', typeFormatters.media, 'media_url');
    });
  });

  describe('SIMPLE', () => {
    it('should return the correct NUMERIC value', () => {
      testSimple(1234, typeFormatters.numeric, 1234);
      testSimple(0, typeFormatters.numeric, 0);
    });

    it('should return the correct TEXT value', () => {
      testSimple('text', typeFormatters.text, 'text');
    });

    it('should return the correct MARKDOWN value', () => {
      testSimple('markdown', typeFormatters.markdown, 'markdown');
    });
  });

  describe('GEOLOCATION', () => {
    it('should return the correct GEOLOCATION value', () => {
      testSimple(
        { lat: '46.2050242', lon: '6.1090692' },
        typeFormatters.geolocation,
        '46.2050242|6.1090692'
      );
    });
  });

  it('should return the correct RELATIONSHIP value', () => {
    const singleField = [{ label: 'Entity 1', value: null }];
    const multipleField = [
      { label: 'Entity 1', value: null },
      { label: 'Entity 2', value: null },
    ];

    const singleValue = typeFormatters.relationship(singleField, {});
    const multipleValue = typeFormatters.relationship(multipleField, {});

    expect(singleValue).toBe('Entity 1');
    expect(multipleValue).toBe('Entity 1|Entity 2');
    testEmptyField(typeFormatters.relationship);
  });

  describe('FILES', () => {
    it('should return the correct DOCUMENTS value', () => {
      const singleField = [{ filename: 'file1.pdf', value: null }];
      const multipleField = [
        { filename: 'file1.pdf', value: null },
        { filename: 'file2.pdf', value: null },
      ];

      const singleValue = formatDocuments({ documents: singleField });
      const multipleValue = formatDocuments({ documents: multipleField });
      const emptyValue = formatDocuments({ documents: [] });

      expect(singleValue).toBe(formatFile('file1.pdf'));
      expect(multipleValue).toBe(`${formatFile('file1.pdf')}|${formatFile('file2.pdf')}`);
      expect(emptyValue).toBe('');
    });

    it('should return the correct ATTACHMENTS value', () => {
      const singleField = [{ filename: 'file1.pdf', entityId: 'entity1', value: null }];
      const multipleField = [
        { filename: 'file1.pdf', entityId: 'entity1', value: null },
        { filename: 'file2.pdf', entityId: 'entity1', value: null },
      ];

      const singleValue = formatAttachments({ attachments: singleField, _id: 'entity1' });
      const multipleValue = formatAttachments({ attachments: multipleField, _id: 'entity1' });
      const emptyValue = formatDocuments({ attachments: [], _id: 'entity1' });

      expect(singleValue).toBe(formatAttachment('file1.pdf', 'entity1'));
      expect(multipleValue).toBe(
        `${formatAttachment('file1.pdf', 'entity1')}|${formatAttachment('file2.pdf', 'entity1')}`
      );
      expect(emptyValue).toBe('');
    });
  });

  describe('HELPERS', () => {
    it('should format timestamps to the provided format, mapped to momentjs', () => {
      const timestamp = 1585851003;

      const formatted1 = formatDate(timestamp, 'yyyy/MM/dd');

      expect(unixFn).toHaveBeenCalledWith(timestamp);
      expect(formatFn).toHaveBeenCalledWith('YYYY/MM/DD');
      expect(formatted1).toBe('1');
    });

    it('should build the correct document url', () => {
      const fileName = 'fileName.pdf';

      const url = formatFile(fileName);

      expect(url).toBe('/files/fileName.pdf');
    });

    it('should build the correct attachment url', () => {
      const fileName = 'fileName.pdf';
      const entityId = 'entity1';

      const url = formatAttachment(fileName, entityId);

      expect(url).toBe('/api/attachments/download?_id=entity1&file=fileName.pdf');
    });
  });
});
