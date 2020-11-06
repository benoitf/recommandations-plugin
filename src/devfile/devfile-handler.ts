/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import * as che from '@eclipse-che/plugin';

import { che as cheApi } from '@eclipse-che/api';
import { injectable } from 'inversify';

/**
 * Manage access to the devfile
 */
@injectable()
export class DevfileHandler {
  private lastAccess: number;

  /**
   * Check if there are chePlugins in the current devfile
   */
  async hasPlugins(): Promise<boolean> {
    const cheWorkspace = await this.getWorkspace();
    const devfile = cheWorkspace.devfile;
    const devfilePlugins: string[] = [];
    if (devfile && devfile.components) {
      devfile.components.forEach(component => {
        let id = component.id;
        if (id && component.type === 'chePlugin') {
          if (id.endsWith('/latest')) {
            id = id.substring(0, id.length - '/latest'.length);
          }
          devfilePlugins.push(id);
        }
      });
    }
    return devfilePlugins.length > 0;
  }

  /**
   * Add che plug-ins to the current devfile
   * Can throw an error when updating the workspace
   */
  async addPlugins(pluginIds: string[]): Promise<void> {
    const workspace = await this.getWorkspace();
    // always an id
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const workspaceId = workspace.id!;
    // always has a devfile now
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const devfile = workspace.devfile!;

    const components: cheApi.workspace.devfile.Component[] = devfile.components || [];
    pluginIds.forEach(plugin => components.push({ id: `${plugin}/latest`, type: 'chePlugin' }));
    // use the new components
    devfile.components = components;

    // can throw an error
    await che.workspace.update(workspaceId, workspace);
  }

  protected async getWorkspace(): Promise<cheApi.workspace.Workspace> {
    return che.workspace.getCurrentWorkspace();
  }
}
