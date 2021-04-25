import path from 'path';
import fs from 'fs';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import db from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import {
  uploadsPath,
  customUploadsPath,
  setupTestUploadedPaths,
  fileExists,
} from 'api/files/filesystem';
import { setUpApp, socketEmit, iosocket } from 'api/utils/testingRoutes';
import { FileType } from 'shared/types/fileType';
import entities from 'api/entities';

import { fixtures, templateId, importTemplate } from './fixtures';
import { files } from '../files';
import uploadRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('upload routes', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(Date, 'now').and.returnValue(1000);
    spyOn(errorLog, 'error'); //just to avoid annoying console output
    await db.clearAllAndLoad(fixtures);
    await setupTestUploadedPaths();
  });

  afterAll(async () => db.disconnect());

  const uploadDocument = async (filepath: string): Promise<SuperTestResponse> =>
    socketEmit('documentProcessed', async () =>
      request(app)
        .post('/api/files/upload/document')
        .field('entity', 'sharedId1')
        .attach('file', path.join(__dirname, filepath))
    );

  describe('POST/files/upload/documents', () => {
    it('should upload the file', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [upload] = await files.get({ entity: 'sharedId1' }, '+fullText');
      expect(await fileExists(uploadsPath(upload.filename))).toBe(true);
    }, 10000);

    it('should process and reindex the document after upload', async () => {
      const res: SuperTestResponse = await uploadDocument(
        'uploads/f2082bf51b6ef839690485d7153e847a.pdf'
      );

      expect(res.body).toEqual(
        expect.objectContaining({
          originalname: 'f2082bf51b6ef839690485d7153e847a.pdf',
          status: 'ready',
        })
      );

      expect(iosocket.emit).toHaveBeenCalledWith('conversionStart', 'sharedId1');
      expect(iosocket.emit).toHaveBeenCalledWith('documentProcessed', 'sharedId1');

      const [upload] = await files.get(
        { originalname: 'f2082bf51b6ef839690485d7153e847a.pdf' },
        '+fullText'
      );

      expect(upload).toEqual(
        expect.objectContaining({
          entity: 'sharedId1',
          type: 'document',
          status: 'ready',
          fullText: { 1: 'Test[[1]] file[[1]]\n\n' },
          totalPages: 1,
          language: 'other',
          filename: expect.stringMatching(/.*\.pdf/),
          originalname: 'f2082bf51b6ef839690485d7153e847a.pdf',
          creationDate: 1000,
        })
      );
    }, 10000);

    it('should generate a thumbnail for the document', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [{ filename = '', language }] = await files.get({
        entity: 'sharedId1',
        type: 'thumbnail',
      });

      expect(language).toBe('other');
      expect(fs.readFileSync(uploadsPath(filename))).toBeDefined();
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        await uploadDocument('uploads/eng.pdf');

        const [upload] = await files.get({ originalname: 'eng.pdf' });
        expect(upload.language).toBe('eng');
      }, 10000);

      it('should detect Spanish documents and store the result', async () => {
        await uploadDocument('uploads/spn.pdf');

        const [upload] = await files.get({ originalname: 'spn.pdf' });
        expect(upload.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document status to failed and emit a socket conversionFailed event with the id of the document', async () => {
        await socketEmit('conversionFailed', async () =>
          request(app)
            .post('/api/files/upload/document')
            .field('entity', 'sharedId1')
            .attach('file', path.join(__dirname, 'uploads/invalid_document.txt'))
        );

        const [upload] = await files.get({ originalname: 'invalid_document.txt' }, '+fullText');
        expect(upload.status).toBe('failed');
      });

      it('should return the file object', async () => {
        const response: SuperTestResponse = await request(app)
          .post('/api/files/upload/document')
          .field('entity', 'sharedId1')
          .attach('file', path.join(__dirname, 'uploads/invalid_document.txt'));

        expect(response.body.status).toBe('failed');
        expect(response.body._id).toBeDefined();
        expect(response.body.originalname).toBe('invalid_document.txt');
      });
    });
  });

  describe('POST/files/upload/custom', () => {
    it('should save the upload and return it', async () => {
      const response: SuperTestResponse = await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'custom',
          filename: expect.stringMatching(/.*\.txt/),
          mimetype: 'text/plain',
          originalname: 'test.txt',
          size: 5,
        })
      );
    });

    it('should save the file on customUploads path', async () => {
      await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      expect(fs.readFileSync(customUploadsPath(file.filename || ''))).toBeDefined();
    });
  });

  describe('POST /api/import', () => {
    it('should import the entried from the csv file', async () => {
      await socketEmit('IMPORT_CSV_END', async () =>
        request(app)
          .post('/api/import')
          .field('template', importTemplate.toString())
          .attach('file', `${__dirname}/uploads/importcsv.csv`)
      );

      expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_START');
      expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_PROGRESS', 1);
      expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_PROGRESS', 2);

      const imported = await entities.get({ template: importTemplate });
      expect(imported).toEqual([
        expect.objectContaining({ title: 'imported entity one' }),
        expect.objectContaining({ title: 'imported entity two' }),
      ]);
    });

    describe('on error', () => {
      it('should emit the error', async () => {
        await socketEmit('IMPORT_CSV_ERROR', async () =>
          request(app)
            .post('/api/import')
            .field('template', templateId.toString())
            .attach('file', `${__dirname}/uploads/import.zip`)
        );

        expect(iosocket.emit).toHaveBeenCalledWith(
          'IMPORT_CSV_ERROR',
          expect.objectContaining({ code: 500 })
        );
      });
    });
  });

  describe('DELETE/files', () => {
    it('should delete thumbnails asociated with documents deleted', async () => {
      await uploadDocument('uploads/f2082bf51b6ef839690485d7153e847a.pdf');

      const [file]: FileType[] = await files.get({
        originalname: 'f2082bf51b6ef839690485d7153e847a.pdf',
      });

      await request(app)
        .delete('/api/files')
        .query({ _id: file._id?.toString() });

      const [thumbnail]: FileType[] = await files.get({ filename: `${file._id}.jpg` });
      expect(thumbnail).not.toBeDefined();
    });
  });
});
