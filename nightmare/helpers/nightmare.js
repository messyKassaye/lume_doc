/*eslint no-console: 0 */
/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}] */
import Nightmare from 'nightmare';
import nightmareUpload from 'nightmare-upload';
import realMouse from 'nightmare-real-mouse';

import './LibraryDSL.js';
import './connectionsDSL.js';
import './navlinksDSL';
import './extensions.js';

realMouse(Nightmare);
nightmareUpload(Nightmare);
const show = !!process.argv.includes('--show') || process.env.SHOW_E2E;
export default function createNightmare(width = 1200, height = 600) {
  const nightmare = new Nightmare({
    show,
    typeInterval: 10,
    x: 0,
    y: 0,
    webPreferences: {
      preload: `${__dirname}/custom-preload.js`,
      webSecurity: false,
    },
    switches: {
      'ignore-certificate-errors': true,
    },
  }).viewport(width, height);

  nightmare.on('page', (_type, message, error) => {
    console.error(message);
    fail(error);
  });

  nightmare.on('dom-ready', () => {
    nightmare.inject('css', `${__dirname}/tests.css`);
  });

  nightmare.on('console', (type, message) => {
    if (type === 'error') {
      if (
        message &&
        (typeof message !== 'object' ||
          Object.keys(message).length ||
          message.toString() !== '[object Object]')
      ) {
        fail(message);
      } else {
        console.warn(message);
      }
    }
    if (type === 'log') {
      console.log(message);
    }
  });

  return nightmare;
}
