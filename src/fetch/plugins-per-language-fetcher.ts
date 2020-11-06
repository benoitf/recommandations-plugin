/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import * as theia from '@theia/plugin';

import AxiosInstance from 'axios';
import { LanguagePlugins } from './language-plugins';
import { injectable } from 'inversify';

@injectable()
export class PluginsPerLanguageFetcher {
  public static readonly BASE_JSON_URL =
    'https://raw.githubusercontent.com/benoitf/my-che-repository/master/v3/recommendations/language';

  async fetch(languageID: string): Promise<LanguagePlugins[]> {
    let languagePlugins: LanguagePlugins[] = [];
    // need to fetch
    try {
      const response = await AxiosInstance.get(`${PluginsPerLanguageFetcher.BASE_JSON_URL}/${languageID}.json`);
      languagePlugins = response.data;
    } catch (error) {
      if (error.response.status !== 404) {
        theia.window.showInformationMessage(`Error while fetching featured recommendations ${error}`);
      }
    }
    return languagePlugins;
  }
}
