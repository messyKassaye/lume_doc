/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { host } from '../config';

describe('Copy from', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
    await page.goto(`${host}/library`);
  });

  it('Should create new entity, copy its metadata from an existing one and save it as new relationship', async () => {
    await expect(page).toClick(
      'div.documents-list > div > div.item-group.item-group-zoom-0 > div:nth-child(3) > div.item-actions > div > a'
    );
    await expect(page).toClick('.tab-link', {
      text: 'Connections',
    });
    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button'
    );
    await expect(page).toClick('button', {
      text: 'Add entities / documents',
    });

    await page.waitFor(200); // wait for slide animation to end
    await expect(page).toClick('button', {
      text: 'Create Entity',
    });

    await page.waitForSelector('textarea[name="relationships.metadata.title"]');
    await expect(page).toFill('textarea[name="relationships.metadata.title"]', 'Test title');
    await page.select('select', '58ada34c299e826748545061');
    await page.waitFor(100); // re-render of the form
    await expect(page).toClick('button', {
      text: 'Copy From',
    });

    await page.waitFor(50); // wait for animation
    await expect(page).toFill(
      'aside.connections-metadata div.search-box > div > input',
      'artavia',
      { delay: 100 }
    );
    await page.waitFor(50); // search delay
    await expect(page).toClick('div.copy-from .item-info', { text: 'Artavia Murillo et al' });

    await expect(page).toClick('button', { text: 'Copy Highlighted' });
    await expect(page).toClick('.side-panel button', { text: 'Save' });
    await page.waitFor(100); // save delay
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('.item-info', { text: 'Test title' });
    await page.waitFor(50); // animation
    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(3) dd',
      {
        text: 'Costa Rica',
      }
    );

    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(4) dd',
      {
        text: 'Activo',
      }
    );

    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(5) dd',
      {
        text: 'Derechos reproductivos',
      }
    );

    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(8) dd',
      {
        text: 'Dec 19, 2011',
      }
    );
  });

  afterAll(async () => {
    await logout();
  });
});
