/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
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
import { RecommandationPlugin } from '../../src/plugin/recommandation-plugin';
import { VSCodeCurrentPlugins } from '../../src/analyzer/vscode-current-plugins';
import { WorkspaceHandler } from '../../src/workspace/workspace-handler';

describe('Test RecommandedPlugin', () => {
  process.on('unhandledRejection', (error: any) => {
    console.log('=== UNHANDLED REJECTION ===');
    console.dir(error.stack);
  });

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

  const workspacePluginMock = {
    exports: {
      onDidCloneSources: jest.fn(),
    },
  };

  beforeEach(() => {
    container = new Container();
    jest.resetAllMocks();
    container.bind(FeaturedPluginLogic).toConstantValue(featuredPluginLogic);
    container.bind(WorkspaceHandler).toConstantValue(workspaceHandler);
    container.bind(DevfileHandler).toConstantValue(devfileHandler);
    container.bind(VSCodeCurrentPlugins).toConstantValue(vsCodeCurrentPlugins);
    container.bind(FeaturedFetcher).toConstantValue(featuredFetcher);
    container.bind(FindFileExtensions).toConstantValue(findFileExtensions);
    container.bind(RecommandationPlugin).toSelf().inSingletonScope();
    getFeaturedPluginsMock.mockReturnValue([]);
  });

  test('Check onClone callback is not called if workspacePlugin is not there', async () => {
    const recommandationPlugin = container.get(RecommandationPlugin);
    const spyAfterClone = jest.spyOn(recommandationPlugin, 'afterClone');

    await recommandationPlugin.start();
    expect(workspacePluginMock.exports.onDidCloneSources).toBeCalledTimes(0);
    expect(spyAfterClone).toBeCalledTimes(0);
  });

  test('Check onClone callback is registered', async () => {
    (theia.plugins.getPlugin as jest.Mock).mockReturnValue(workspacePluginMock);
    const recommandationPlugin = container.get(RecommandationPlugin);
    const spyAfterClone = jest.spyOn(recommandationPlugin, 'afterClone');

    await recommandationPlugin.start();
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

    const recommandationPlugin = container.get(RecommandationPlugin);
    const spyInstallPlugins = jest.spyOn(recommandationPlugin, 'installPlugins');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    getFeaturedPluginsMock.mockReset();
    getFeaturedPluginsMock.mockResolvedValue(['redhat/java']);

    await recommandationPlugin.start();
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

    const recommandationPlugin = container.get(RecommandationPlugin);
    getFeaturedPluginsMock.mockReset();
    getFeaturedPluginsMock.mockResolvedValue(['redhat/java']);

    addPluginsMock.mockRejectedValue('Unable to install plug-ins');

    await recommandationPlugin.start();
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

    const recommandationPlugin = container.get(RecommandationPlugin);
    const spyInstallPlugins = jest.spyOn(recommandationPlugin, 'installPlugins');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    await recommandationPlugin.start();

    // user click on yes, I want to install recommandations
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

    const recommandationPlugin = container.get(RecommandationPlugin);
    const spyInstallPlugins = jest.spyOn(recommandationPlugin, 'installPlugins');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    await recommandationPlugin.start();

    // user click on yes, I want to install recommandations
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
    const recommandationPlugin = container.get(RecommandationPlugin);
    const spyInstallPlugins = jest.spyOn(recommandationPlugin, 'stop');
    expect(spyInstallPlugins).toBeCalledTimes(0);

    recommandationPlugin.stop();
    expect(spyInstallPlugins).toBeCalled();
  });
});
