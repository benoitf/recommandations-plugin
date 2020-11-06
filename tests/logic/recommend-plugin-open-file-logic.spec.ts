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

import * as theia from '@theia/plugin';

import { Container } from 'inversify';
import { FeaturePluginLogicRequest } from '../../src/logic/feature-plugin-logic-request';
import { Featured } from '../../src/fetch/featured';
import { LanguagePlugins } from '../../src/fetch/language-plugins';
import { PluginsPerLanguageFetcher } from '../../src/fetch/plugins-per-language-fetcher';
import { RecommendPluginOpenFileLogic } from '../../src/logic/recommend-plugin-open-file-logic';
import { RecommendationPluginAnalysis } from '../../src/plugin/recommendation-plugin-analysis';
import { VSCodeCurrentPluginsLanguages } from '../../src/analyzer/vscode-current-plugins-languages';

describe('Test RecommendPluginOpenFileLogic', () => {
  let container: Container;

  const languagesPerFileExtensions = new Map<string, string[]>();
  const pluginsPerLanguageID = new Map<string, string[]>();

  const vsCodeCurrentPluginsLanguages: VSCodeCurrentPluginsLanguages = {
    languagesPerFileExtensions,
    pluginsPerLanguageID,
  };

  const fetchMethodMock = jest.fn();
  const pluginsPerLanguageFetcher = {
    fetch: fetchMethodMock,
  } as any;

  beforeEach(() => {
    languagesPerFileExtensions.clear();
    pluginsPerLanguageID.clear();
    jest.resetAllMocks();
    container = new Container();
    container.bind(PluginsPerLanguageFetcher).toConstantValue(pluginsPerLanguageFetcher);
    container.bind(RecommendPluginOpenFileLogic).toSelf().inSingletonScope();
  });

  test('suggest java as no plug-in yet', async () => {
    const openFileLogic = container.get(RecommendPluginOpenFileLogic);

    const devfileHasPlugins = true;
    const workspaceFolder = { uri: { path: '/projects' } } as any;
    const workspaceFolders: theia.WorkspaceFolder[] = [workspaceFolder];
    theia.workspace.workspaceFolders = workspaceFolders;
    const document = {
      fileName: '/projects/helloworld.java',
      languageId: 'java',
    } as any;

    const remoteAvailablePlugins: LanguagePlugins[] = [
      {
        category: 'Programming Languages',
        ids: ['plugin/java/latest'],
      },
      {
        category: 'Other',
        ids: ['plugin/java2/latest'],
      },
      {
        category: 'Programming Languages',
        ids: ['plugin/java/latest'],
      },
    ];
    fetchMethodMock.mockResolvedValue(remoteAvailablePlugins);

    const recommendationPluginAnalysis: RecommendationPluginAnalysis = {
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins,
      featuredList: [],
    };

    await openFileLogic.onOpenFile(document, recommendationPluginAnalysis);
    const showInformationMessageMock = theia.window.showInformationMessage as jest.Mock;
    expect(showInformationMessageMock).toBeCalled();
    expect(showInformationMessageMock.mock.calls[0][0]).toContain(
      "The plug-in registry has plug-in that can help with 'java' files: plugin/java/latest"
    );
  });

  test('do not suggest when there are already plugins for the current language ID', async () => {
    const openFileLogic = container.get(RecommendPluginOpenFileLogic);
    languagesPerFileExtensions.set('.java', ['java']);
    pluginsPerLanguageID.set('java', ['redhat/java']);

    const devfileHasPlugins = true;
    const workspaceFolder = { uri: { path: '/projects' } } as any;
    const workspaceFolders: theia.WorkspaceFolder[] = [workspaceFolder];
    theia.workspace.workspaceFolders = workspaceFolders;
    const document = {
      fileName: '/projects/helloworld.java',
      languageId: 'java',
    } as any;

    const remoteAvailablePlugins: LanguagePlugins[] = [];
    fetchMethodMock.mockResolvedValue(remoteAvailablePlugins);

    const recommendationPluginAnalysis: RecommendationPluginAnalysis = {
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins,
      featuredList: [],
    };

    await openFileLogic.onOpenFile(document, recommendationPluginAnalysis);
    const showInformationMessageMock = theia.window.showInformationMessage as jest.Mock;
    expect(showInformationMessageMock).toBeCalledTimes(0);
  });

  test('No suggestion when document is not part of workspace', async () => {
    const openFileLogic = container.get(RecommendPluginOpenFileLogic);
    const workspaceFolder = { uri: { path: '/projects' } } as any;
    const workspaceFolders: theia.WorkspaceFolder[] = [workspaceFolder];
    theia.workspace.workspaceFolders = workspaceFolders;
    const document = {
      fileName: '/external/external.java',
      languageId: 'java',
    } as any;

    const recommendationPluginAnalysis: RecommendationPluginAnalysis = {
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins: false,
      featuredList: [],
    };

    await openFileLogic.onOpenFile(document, recommendationPluginAnalysis);
    // we do not call fetch
    expect(fetchMethodMock).toBeCalledTimes(0);
  });

  test('No suggestion when no workspace folders', async () => {
    const openFileLogic = container.get(RecommendPluginOpenFileLogic);
    theia.workspace.workspaceFolders = undefined;
    const document = {
      fileName: '/external/external.java',
      languageId: 'java',
    } as any;

    const recommendationPluginAnalysis: RecommendationPluginAnalysis = {
      vsCodeCurrentPluginsLanguages,
      devfileHasPlugins: false,
      featuredList: [],
    };

    await openFileLogic.onOpenFile(document, recommendationPluginAnalysis);
    // we do not call fetch
    expect(fetchMethodMock).toBeCalledTimes(0);
  });
});
