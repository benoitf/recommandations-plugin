/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import * as globby from 'globby';
import * as theia from '@theia/plugin';

import { injectable } from 'inversify';

@injectable()
export class FindFileExtensions {
  public static readonly DEFAULT_SCAN_TIME_PER_WORKSPACE_FOLDER: number = 3000;

  async find(
    workspaceFolders: theia.WorkspaceFolder[],
    timeout: number = FindFileExtensions.DEFAULT_SCAN_TIME_PER_WORKSPACE_FOLDER
  ): Promise<string[]> {
    // get extensions for each theia workspace
    const extensions: string[][] = await Promise.all(
      workspaceFolders.map(workspaceFolder => {
        theia.window.showInformationMessage('finding extensions in folder ' + workspaceFolder.uri.path);
        return this.findInFolder(workspaceFolder.uri.path, timeout);
      })
    );
    return extensions.reduce((acc, e) => acc.concat(e), []);
  }

  findInFolder(workspaceFolder: string, timeout: number): Promise<string[]> {
    const fileExtensions: string[] = [];
    const options: globby.GlobbyOptions = {
      gitignore: true,
      cwd: workspaceFolder,
    };
    const stream = globby.stream('**/*', options);
    stream.on('data', entry => {
      const fileExtension = entry.slice(((entry.lastIndexOf('.') - 1) >>> 0) + 1);
      if (fileExtension.length > 0 && !fileExtensions.includes(fileExtension)) {
        fileExtensions.push(fileExtension);
      }
    });
    // do not let timeout send the event a new time.
    let alreadyStopped = false;
    stream.on('end', () => {
      alreadyStopped = true;
    });
    setTimeout(() => {
      if (!alreadyStopped) {
        stream.emit('end');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).destroy();
      }
    }, timeout);

    return new Promise<string[]>((resolve, reject) => {
      stream.on('end', () => {
        resolve(fileExtensions);
      });
      stream.on('error', error => {
        reject(new Error(error));
      });
    });
  }
}
