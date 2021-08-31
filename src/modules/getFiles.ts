import { readdir, stat } from "fs/promises";
import path from "path";

import { Request, Response } from "express";

import { errorHandler } from "../utils/errorHandler";

import { generateHtml } from "./generateFileHtml";

/**
 * Generates a list of file names and paths for the given directory.
 *
 * @param {string} directory The directory to get files from.
 * @param {string[]} fileList The current list of file paths.
 * @returns {Promise<string[]>} The list of file paths.
 */
export const getFiles = async (
  directory: string,
  fileList: string[]
): Promise<string[]> => {
  try {
    const files = await readdir(directory);
    for (const file of files) {
      const fileStat = await stat(path.join(directory, file));
      if (fileStat.isDirectory()) {
        // Disable the following line to allow for recursive calls.
        // eslint-disable-next-line no-param-reassign
        fileList = await getFiles(path.join(directory, file), fileList);
      } else {
        fileList.push(path.join(directory, file));
      }
    }
    return fileList;
  } catch (error) {
    errorHandler("get files", error);
    return [];
  }
};

/**
 * Parses the file paths, replacing "assets" with "content".
 *
 * @param {string[]} files The list of file paths to parse.
 * @returns {string[]} The parsed paths.
 */
export const parseFileList = (files: string[]): string[] => {
  try {
    files.forEach((file, index) => {
      const split = file.split(/\\|\//);
      const targetIndex = split.indexOf("assets");
      const newSplit = split.slice(targetIndex);
      const newPath = newSplit.join("/").replace("assets", "content");
      files[index] = newPath;
    });
    return files;
  } catch (error) {
    errorHandler("parse files", error);
    return [];
  }
};

/**
 * Route handler for the `/files` endpoint. Returns a list of files available
 * on the CDN.
 *
 * @param {Request} _ The request object.
 * @param {Response} res The response object.
 */
export const getFilesRoute = async (
  _: Request,
  res: Response
): Promise<void> => {
  try {
    const rawFileList = await getFiles(path.join(__dirname + "/../assets"), []);
    const parsedFileList = parseFileList(rawFileList);
    const finalHtml = generateHtml(parsedFileList);
    res.send(finalHtml);
  } catch (error) {
    errorHandler("files route", error);
    res.status(500).send("An unknown error has occured!");
  }
};
