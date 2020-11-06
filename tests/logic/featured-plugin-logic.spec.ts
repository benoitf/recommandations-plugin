/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import { Container } from 'inversify';
import { FeaturePluginLogicRequest } from '../../src/logic/feature-plugin-logic-request';
import { Featured } from '../../src/fetch/featured';
import { FeaturedPluginLogic } from '../../src/logic/featured-plugin-logic';
import { VSCodeCurrentPluginsLanguages } from '../../src/analyzer/vscode-current-plugins-languages';

describe('Test FeaturedPluginLogic', () => {
  let container: Container;

  const languagesPerFileExtensions = new Map<string, string[]>();
  const pluginsPerLanguageID = new Map<string, string[]>();

  const vsCodeCurrentPluginsLanguages: VSCodeCurrentPluginsLanguages = {
    languagesPerFileExtensions,
    pluginsPerLanguageID,
  };

  beforeEach(() => {
    languagesPerFileExtensions.clear();
    pluginsPerLanguageID.clear();
    container = new Container();
    container.bind(FeaturedPluginLogic).toSelf().inSingletonScope();
  });

  test('basic java', async () => {
    const featuredPluginLogic = container.get(FeaturedPluginLogic);

    languagesPerFileExtensions.set('.java', ['java']);
    pluginsPerLanguageID.set('java', ['redhat/java']);

    const featured: Featured = {
      id: 'redhat/java',
      onLanguage: ['java'],
      workspaceContains: [],
      contributes: {
        languages: [
          {
            id: 'java',
            aliases: [],
            extensions: ['.java'],
            filenames: [],
          },
        ],
      },
    };
    const featuredList = [featured];
    const extensionsInCheWorkspace = ['.java'];
    const devfileHasPlugins = true;

    const request: FeaturePluginLogicRequest = {
      featuredList,
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins,
      extensionsInCheWorkspace,
    };

    const featuredPlugins = await featuredPluginLogic.getFeaturedPlugins(request);
    expect(featuredPlugins).toBeDefined();
    expect(featuredPlugins.length).toBe(1);
    expect(featuredPlugins[0]).toBe('redhat/java');
  });

  test('basic unknown language', async () => {
    const featuredPluginLogic = container.get(FeaturedPluginLogic);

    const featuredList: Featured[] = [];
    const extensionsInCheWorkspace = ['.java'];
    const devfileHasPlugins = true;

    const request: FeaturePluginLogicRequest = {
      featuredList,
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins,
      extensionsInCheWorkspace,
    };

    const featuredPlugins = await featuredPluginLogic.getFeaturedPlugins(request);
    expect(featuredPlugins).toBeDefined();
    expect(featuredPlugins.length).toBe(0);
  });

  test('basic featured without language', async () => {
    const featuredPluginLogic = container.get(FeaturedPluginLogic);

    languagesPerFileExtensions.set('.java', ['java']);
    pluginsPerLanguageID.set('java', ['redhat/java']);

    const featured: Featured = {
      id: 'redhat/java',
      workspaceContains: [],
      contributes: {
        languages: [
          {
            id: 'java',
            aliases: [],
            extensions: ['.java'],
            filenames: [],
          },
        ],
      },
    };
    const featuredList = [featured];

    const extensionsInCheWorkspace = ['.java'];
    const devfileHasPlugins = true;

    const request: FeaturePluginLogicRequest = {
      featuredList,
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins,
      extensionsInCheWorkspace,
    };

    const featuredPlugins = await featuredPluginLogic.getFeaturedPlugins(request);
    expect(featuredPlugins).toBeDefined();
    expect(featuredPlugins.length).toBe(0);
  });
});
