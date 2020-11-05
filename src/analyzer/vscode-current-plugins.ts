/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import * as theia from '@theia/plugin';

import { LanguageInformation } from './language-information';
import { VSCodeCurrentPluginsLanguages } from './vscode-current-plugins-languages';
import { injectable } from 'inversify';

@injectable()
export class VSCodeCurrentPlugins {
  async analyze(): Promise<VSCodeCurrentPluginsLanguages> {
    // Map between file extension and language ID
    const languagesPerFileExtensions = new Map<string, string[]>();

    // Map between a language ID and the plugin's IDs
    const pluginsPerLanguageID = new Map<string, string[]>();

    theia.plugins.all.forEach(plugin => {
      // populate map between a file extension and the language ID
      const contributes = plugin.packageJSON.contributes || { languages: [] };
      const languages: LanguageInformation[] = contributes.languages || [];
      languages.forEach(language => {
        const languageID = language.id;
        if (languageID) {
          const fileExtensions = language.extensions || [];
          fileExtensions.forEach(fileExtension => {
            let existingLanguageIds = languagesPerFileExtensions.get(fileExtension);
            if (!existingLanguageIds) {
              existingLanguageIds = [];
              languagesPerFileExtensions.set(fileExtension, existingLanguageIds);
            }
            if (!existingLanguageIds.includes(languageID)) {
              existingLanguageIds.push(languageID);
            }
          });
        }
      });

      // populate map between a language ID and a plug-in's ID
      const activationEvents: string[] = plugin.packageJSON.activationEvents || [];
      activationEvents.forEach(activationEvent => {
        if (activationEvent.startsWith('onLanguage:')) {
          const languageID = activationEvent.substring('onLanguage:'.length);
          let existingPlugins = pluginsPerLanguageID.get(languageID);
          if (!existingPlugins) {
            existingPlugins = [];
            pluginsPerLanguageID.set(languageID, existingPlugins);
          }
          if (!existingPlugins.includes(plugin.id)) {
            existingPlugins.push(plugin.id);
          }
        }
      });
    });

    return { languagesPerFileExtensions, pluginsPerLanguageID };
  }
}
