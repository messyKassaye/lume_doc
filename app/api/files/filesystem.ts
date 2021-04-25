import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import ID from 'shared/uniqueID';
import asyncFS from 'api/utils/async-fs';
import { tenants } from 'api/tenants/tenantContext';
import { testingTenants } from 'api/utils/testingTenants';
import { promisify } from 'util';

import { FileType } from '../../shared/types/fileType';

export type FilePath = string;
export type pathFunction = (fileName?: string) => FilePath;
const LOGS_DIR = './log';

const uploadsPath: pathFunction = (fileName: string = ''): FilePath =>
  path.join(tenants.current().uploadedDocuments, fileName);

const attachmentsPath: pathFunction = (fileName: string = ''): FilePath =>
  path.join(tenants.current().attachments, fileName);

const customUploadsPath: pathFunction = (fileName: string = ''): FilePath =>
  path.join(tenants.current().customUploads, fileName);

const temporalFilesPath: pathFunction = (fileName: string = ''): FilePath =>
  path.join(tenants.current().temporalFiles, fileName);

const activityLogPath: pathFunction = (): FilePath =>
  path.join(LOGS_DIR, `${tenants.current().name}_activity.log`);

async function deleteFile(file: FilePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, err => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      }
      resolve();
    });
  });
}

async function deleteFiles(files: FilePath[]) {
  return Promise.all(files.map(async file => deleteFile(file)));
}

const createDirIfNotExists = async (dirPath: string) => {
  try {
    await asyncFS.mkdir(dirPath);
  } catch (e) {
    if (!e.message.match(/file already exists/)) {
      throw e;
    }
  }
};

const generateUploadsPath = async (subPath: string) => {
  if (subPath) {
    await createDirIfNotExists(`${__dirname}/specs/uploads/${subPath}`);
    await createDirIfNotExists(`${__dirname}/specs/customUploads/${subPath}`);
  }
  return {
    uploadedDocuments: `${__dirname}/specs/uploads/${subPath}`,
    attachments: `${__dirname}/specs/uploads/${subPath}`,
    customUploads: `${__dirname}/specs/customUploads/${subPath}`,
    temporalFiles: `${__dirname}/specs/uploads/${subPath}`,
  };
};

const setupTestUploadedPaths = async (subFolder: string = '') => {
  testingTenants.changeCurrentTenant(await generateUploadsPath(subFolder));
};

const deleteUploadedFiles = async (files: FileType[]) =>
  deleteFiles(
    files
      .filter(f => f.filename)
      .map(({ filename = '', type }) => {
        if (type === 'custom') {
          return customUploadsPath(filename);
        }
        return uploadsPath(filename);
      })
  );

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);

const fileExists = async (filePath: FilePath): Promise<boolean> =>
  new Promise((resolve, reject) => {
    fs.access(filePath, err => {
      if (err === null) {
        resolve(true);
      }
      if (err?.code === 'ENOENT') {
        resolve(false);
      }
      if (err) {
        reject(err);
      }
    });
  });

const generateFileName = ({ originalname = '' }: FileType) =>
  Date.now() + ID() + path.extname(originalname);

/**
 * Create a file from a read stream and save it to one of uwazi filesystem paths
 * @param destination by default this will be uploadsPaths,
 * if you want another one you can pass filesystem destinatations
 * e.g. attachmentsPath()
 *
 */
const fileFromReadStream = async (
  fileName: FilePath,
  readStream: Readable,
  destination: string | undefined = undefined
): Promise<FilePath> =>
  new Promise((resolve, reject) => {
    const filePath = path.join(destination || uploadsPath(), fileName);
    const writeStream = fs.createWriteStream(filePath);
    readStream
      .pipe(writeStream)
      .on('finish', () => resolve(filePath))
      .on('error', reject);
  });

const streamToString = async (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const getFileContent = async (fileName: FilePath): Promise<string> =>
  asyncFS.readFile(uploadsPath(fileName), 'utf8');

export {
  setupTestUploadedPaths,
  deleteUploadedFiles,
  createDirIfNotExists,
  deleteFiles,
  deleteFile,
  generateFileName,
  fileFromReadStream,
  fileExists,
  streamToString,
  getFileContent,
  customUploadsPath,
  uploadsPath,
  temporalFilesPath,
  attachmentsPath,
  activityLogPath,
  writeFile,
  appendFile,
};
