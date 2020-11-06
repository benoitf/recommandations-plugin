import * as theia from '@theia/plugin';

/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import { inject, injectable } from 'inversify';

import { PluginsPerLanguageFetcher } from '../fetch/plugins-per-language-fetcher';
import { RecommendationPluginAnalysis } from '../plugin/recommendation-plugin-analysis';

/**
 * Provides recommendation when a file is being opened.
 */
@injectable()
export class RecommendPluginOpenFileLogic {
  @inject(PluginsPerLanguageFetcher)
  private pluginsPerLanguageFetcher: PluginsPerLanguageFetcher;

  async onOpenFile(textDocument: theia.TextDocument, workspaceAnalysis: RecommendationPluginAnalysis): Promise<void> {
    // current workspaces
    const workspacePaths = (theia.workspace.workspaceFolders || []).map(workspaceFolder => workspaceFolder.uri.path);

    // propose stuff only for files inside current workspace
    if (!workspacePaths.some(workspacePath => textDocument.fileName.startsWith(workspacePath))) {
      return;
    }

    // language ID of the current file being opened
    const languageID = textDocument.languageId;

    const installedPlugins = workspaceAnalysis.vsCodeCurrentPluginsLanguages.pluginsPerLanguageID.get(languageID);

    // if we don't have plug-ins locally installed for this plug-in, ask remotely
    if (!installedPlugins) {
      const remoteAvailablePlugins = await this.pluginsPerLanguageFetcher.fetch(languageID);
      const recommendedPlugins: string[] = [];
      remoteAvailablePlugins.map(pluginCategory => {
        if (pluginCategory.category === 'Programming Languages') {
          pluginCategory.ids.forEach(id => {
            if (!recommendedPlugins.includes(id)) {
              recommendedPlugins.push(id);
            }
          });
        }
      });
      theia.window.showInformationMessage(
        `The plug-in registry has plug-in that can help with '${languageID}' files: ${recommendedPlugins}`
      );
    }
  }
}
