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
import { DevfileHandler } from '../../src/devfile/devfile-handler';
import { FeaturedFetcher } from '../../src/fetch/featured-fetcher';
import { FeaturedPluginLogic } from '../../src/logic/featured-plugin-logic';
import { FindFileExtensions } from '../../src/find/find-file-extensions';
import { RecommendPluginOpenFileLogic } from '../../src/logic/recommend-plugin-open-file-logic';
import { RecommendationPlugin } from '../../src/plugin/recommendation-plugin';
import { VSCodeCurrentPlugins } from '../../src/analyzer/vscode-current-plugins';
import { WorkspaceHandler } from '../../src/workspace/workspace-handler';

describe('Test recommendation Plugin', () => {
  let container: Container;

  const findFileExtensions = {
    find: jest.fn(),
  } as any;

  const vsCodeCurrentPlugins = {
    analyze: jest.fn(),
  } as any;

  const featuredFetcher = {
    fetch: jest.fn(),
  } as any;

  const devfileHandlerHasPluginsMock = jest.fn();
  const addPluginsMock = jest.fn();
  const devfileHandler = {
    addPlugins: addPluginsMock,
    hasPlugins: devfileHandlerHasPluginsMock,
  } as any;

  const restartWorkspaceHandlerMock = jest.fn();
  const workspaceHandler = {
    restart: restartWorkspaceHandlerMock,
  };

  const getFeaturedPluginsMock = jest.fn();
  const featuredPluginLogic = {
    getFeaturedPlugins: getFeaturedPluginsMock,
  } as any;

  const onOpenFileRecommendPluginOpenFileLogicMock = jest.fn();
  const recommendPluginOpenFileLogic = {
    onOpenFile: onOpenFileRecommendPluginOpenFileLogicMock,
  } as any;

  const workspacePluginMock = {
    exports: {
      onDidCloneSources: jest.fn(),
    },
  };

  beforeEach(() => {
    container = new Container();
    jest.resetAllMocks();
    container.bind(FeaturedPluginLogic).toConstantValue(featuredPluginLogic);
    container.bind(RecommendPluginOpenFileLogic).toConstantValue(recommendPluginOpenFileLogic);
    container.bind(WorkspaceHandler).toConstantValue(workspaceHandler);
    container.bind(DevfileHandler).toConstantValue(devfileHandler);
    container.bind(VSCodeCurrentPlugins).toConstantValue(vsCodeCurrentPlugins);
    container.bind(FeaturedFetcher).toConstantValue(featuredFetcher);
    container.bind(FindFileExtensions).toConstantValue(findFileExtensions);
    container.bind(RecommendationPlugin).toSelf().inSingletonScope();
    getFeaturedPluginsMock.mockReturnValue([]);
  });

  test('Check onClone callback is not called if workspacePlugin is not there', async () => {
    const recommendationPlugin = container.get(RecommendationPlugin);
    const spyAfterClone = jest.spyOn(recommendationPlugin, 'afterClone');

    await recommendationPlugin.start();
    expect(workspacePluginMock.exports.onDidCloneSources).toBeCalledTimes(0);
    expect(spyAfterClone).toBeCalledTimes(0);
  });

  test('Check onClone callback is registered', async () => {
    (theia.plugins.getPlugin as jest.Mock).mockReturnValue(workspacePluginMock);
    const recommendationPlugin = container.get(RecommendationPlugin);
    const spyAfterClone = jest.spyOn(recommendationPlugin, 'afterClone');

    await recommendationPlugin.start();
    expect(workspacePluginMock.exports.onDidCloneSources).toBeCalled();
    const onDidCloneSourceCalback = workspacePluginMock.exports.onDidCloneSources.mock.calls[0];

    const anonymousFunctionCallback = onDidCloneSourceCalback[0];
    expect(spyAfterClone).toBeCalledTimes(0);
    await anonymousFunctionCallback();
    expect(spyAfterClone).toBeCalled();
  });

  test('Check featuredPlugins with no plugins in the devfile', async () => {
    (theia.plugins.getPlugin as jest.Mock).mockReturnValue(workspacePluginMock);

    // no devfile plugins
    devfileHandlerHasPluginsMock.mockReturnValue(false);

    const recommendationPlugin = container.get(RecommendationPlugin);
    const spyInstallPlugins = jest.spyOn(recommendationPlugin, 'installPlugins');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    getFeaturedPluginsMock.mockReset();
    getFeaturedPluginsMock.mockResolvedValue(['redhat/java']);

    await recommendationPlugin.start();
    // call the callback
    await workspacePluginMock.exports.onDidCloneSources.mock.calls[0][0]();
    expect(spyInstallPlugins).toBeCalled();
    expect(spyInstallPlugins.mock.calls[0][0]).toEqual(['redhat/java']);

    // check restart callback is called
    expect(restartWorkspaceHandlerMock).toBeCalled();
    expect(restartWorkspaceHandlerMock.mock.calls[0][0]).toContain(
      'have been added to your workspace to improve the intellisense'
    );
  });

  test('Check featuredPlugins with no plugins in the devfile with error in install plug-ins', async () => {
    (theia.plugins.getPlugin as jest.Mock).mockReturnValue(workspacePluginMock);

    // no devfile plugins
    devfileHandlerHasPluginsMock.mockReturnValue(false);

    const recommendationPlugin = container.get(RecommendationPlugin);
    getFeaturedPluginsMock.mockReset();
    getFeaturedPluginsMock.mockResolvedValue(['redhat/java']);

    addPluginsMock.mockRejectedValue('Unable to install plug-ins');

    await recommendationPlugin.start();
    // call the callback
    await workspacePluginMock.exports.onDidCloneSources.mock.calls[0][0]();

    // restart not called due to the error
    expect(restartWorkspaceHandlerMock).toBeCalledTimes(0);
    const showInformationMessageMock = theia.window.showInformationMessage as jest.Mock;
    expect(showInformationMessageMock.mock.calls[0][0]).toContain('Unable to add featured plugins');
  });

  test('Check featuredPlugins with plugins in the devfile (usser click Yes on suggestion)', async () => {
    (theia.plugins.getPlugin as jest.Mock).mockReturnValue(workspacePluginMock);

    // no devfile plugins
    devfileHandlerHasPluginsMock.mockReturnValue(true);

    const recommendationPlugin = container.get(RecommendationPlugin);
    const spyInstallPlugins = jest.spyOn(recommendationPlugin, 'installPlugins');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    await recommendationPlugin.start();

    // user click on yes, I want to install recommendations
    const showInformationMessageMock = theia.window.showInformationMessage as jest.Mock;
    showInformationMessageMock.mockResolvedValue({ title: 'Yes' });

    getFeaturedPluginsMock.mockReset();
    getFeaturedPluginsMock.mockResolvedValue(['redhat/java']);

    // call the callback
    await workspacePluginMock.exports.onDidCloneSources.mock.calls[0][0]();
    expect(showInformationMessageMock).toBeCalled();
    expect(showInformationMessageMock.mock.calls[0][0]).toContain('Do you want to install the recommended extensions');

    expect(spyInstallPlugins).toBeCalled();
  });

  test('Check featuredPlugins with plugins in the devfile (usser click no on suggestion)', async () => {
    (theia.plugins.getPlugin as jest.Mock).mockReturnValue(workspacePluginMock);

    // no devfile plugins
    devfileHandlerHasPluginsMock.mockReturnValue(true);

    const recommendationPlugin = container.get(RecommendationPlugin);
    const spyInstallPlugins = jest.spyOn(recommendationPlugin, 'installPlugins');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    await recommendationPlugin.start();

    // user click on yes, I want to install recommendations
    const showInformationMessageMock = theia.window.showInformationMessage as jest.Mock;
    showInformationMessageMock.mockResolvedValue({ title: 'No' });

    getFeaturedPluginsMock.mockReset();
    getFeaturedPluginsMock.mockResolvedValue(['redhat/java']);

    // call the callback
    await workspacePluginMock.exports.onDidCloneSources.mock.calls[0][0]();
    expect(showInformationMessageMock).toBeCalled();
    expect(showInformationMessageMock.mock.calls[0][0]).toContain('Do you want to install the recommended extensions');

    // we never install plug-ins
    expect(spyInstallPlugins).toBeCalledTimes(0);
  });

  test('Check stop', async () => {
    const recommendationPlugin = container.get(RecommendationPlugin);
    const spyInstallPlugins = jest.spyOn(recommendationPlugin, 'stop');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    recommendationPlugin.stop();
    expect(spyInstallPlugins).toBeCalled();
  });

  test('Check recommendation when opening files', async () => {
    // no devfile plugins
    devfileHandlerHasPluginsMock.mockReturnValue(false);

    const recommendationPlugin = container.get(RecommendationPlugin);

    await recommendationPlugin.start();
    const onDidOpenTextDocumentMethodCalback = (theia.workspace.onDidOpenTextDocument as jest.Mock).mock.calls[0];

    // call the callback
    await onDidOpenTextDocumentMethodCalback[0]();

    // check onOpenFile is being called
    expect(onOpenFileRecommendPluginOpenFileLogicMock).toBeCalled();
  });
});
