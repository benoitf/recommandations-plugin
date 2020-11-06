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
import { Featured } from './featured';
import { injectable } from 'inversify';

@injectable()
export class FeaturedFetcher {
  public static readonly FEATURED_JSON_URL =
    'https://gist.githubusercontent.com/benoitf/aa55b92ec12fb7436d6bacbad60e95d5/raw/featured.json';

  async fetch(): Promise<Featured[]> {
    let featuredList: Featured[] = [];
    // need to fetch
    try {
      const response = await AxiosInstance.get(FeaturedFetcher.FEATURED_JSON_URL);
      featuredList = response.data.featured;
    } catch (error) {
      featuredList = [];
      theia.window.showInformationMessage(`Error while fetching featured recommendation ${error}`);
    }
    return featuredList;
  }
}
