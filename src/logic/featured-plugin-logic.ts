/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import { FeaturePluginLogicRequest } from './feature-plugin-logic-request';
import { Featured } from '../fetch/featured';
import { injectable } from 'inversify';

/**
 * Logic about infering the featured plug-ins based on what is currently available in the devfile, the plug-in registry and current plug-ins (could be built-in plug-ins, etc.)
 */
@injectable()
export class FeaturedPluginLogic {
  async getFeaturedPlugins(featurePluginLogicRequest: FeaturePluginLogicRequest): Promise<string[]> {
    const foundLanguageIds = featurePluginLogicRequest.extensionsInCheWorkspace
      .map(
        fileExtension =>
          featurePluginLogicRequest.vsCodeCurrentPluginsLanguages.languagesPerFileExtensions.get(fileExtension) || []
      )
      .reduce((acc, e) => acc.concat(e), []);

    // Now compare with what we have as plugin-registry recommendations
    return foundLanguageIds
      .map(languageID => this.matchingPlugins(languageID, featurePluginLogicRequest.featuredList))
      .reduce((acc, e) => acc.concat(e), []);
  }

  protected matchingPlugins(languageID: string, featuredList: Featured[]): string[] {
    const plugins: string[] = [];
    featuredList.forEach(featured => {
      const pluginID = featured.id;
      const languages: string[] = featured.onLanguage || [];
      if (languages.includes(languageID) && !plugins.includes(pluginID)) {
        plugins.push(pluginID);
      }
    });
    return plugins;
  }
}
