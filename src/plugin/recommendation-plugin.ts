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

import { inject, injectable } from 'inversify';

import { Deferred } from '../util/deferred';
import { DevfileHandler } from '../devfile/devfile-handler';
import { FeaturedFetcher } from '../fetch/featured-fetcher';
import { FeaturedPluginLogic } from '../logic/featured-plugin-logic';
import { FindFileExtensions } from '../find/find-file-extensions';
import { RecommendPluginOpenFileLogic } from '../logic/recommend-plugin-open-file-logic';
import { RecommendationPluginAnalysis } from './recommendation-plugin-analysis';
import { VSCodeCurrentPlugins } from '../analyzer/vscode-current-plugins';
import { WorkspaceHandler } from '../workspace/workspace-handler';

/**
 * Plug-in that is suggesting or adding by default recommendations
 * usecases:
 *  - empty workspaces:
 *     - after initial clone on empty workspaces
 *        - set by default if no existing plug-ins
 *        - suggest if existing plug-ins
 *     - check .vscode/extensions.json file
 *  - when opening new files
 */
@injectable()
export class RecommendationPlugin {
  @inject(FindFileExtensions)
  private findFileExtensions: FindFileExtensions;

  @inject(FeaturedFetcher)
  private featuredFecher: FeaturedFetcher;

  @inject(VSCodeCurrentPlugins)
  private vsCodeCurrentPlugins: VSCodeCurrentPlugins;

  @inject(DevfileHandler)
  private devfileHandler: DevfileHandler;

  @inject(WorkspaceHandler)
  private workspaceHandler: WorkspaceHandler;

  @inject(FeaturedPluginLogic)
  private featuredPluginLogic: FeaturedPluginLogic;

  @inject(RecommendPluginOpenFileLogic)
  private recommendPluginOpenFileLogic: RecommendPluginOpenFileLogic;

  private deferredSetupPromise: Promise<RecommendationPluginAnalysis>;

  async start(): Promise<void> {
    // Bring featured recommendations after projects are cloned
    const workspacePlugin = theia.plugins.getPlugin('Eclipse Che.@eclipse-che/workspace-plugin');
    if (workspacePlugin && workspacePlugin.exports && workspacePlugin.exports.onDidCloneSources) {
      workspacePlugin.exports.onDidCloneSources(() => this.afterClone());
    }

    // Perform tasks in parallel
    const deferredSetup = new Deferred<RecommendationPluginAnalysis>();
    this.deferredSetupPromise = deferredSetup.promise;

    // enable the recommendation on file being opened if no plug-in is matching this file extension
    this.enableRecommendationPluginWhenOpeningFiles();

    // fetch all featured plug-ins from plug-in registry.
    const featuredListPromise = this.featuredFecher.fetch();
    // grab all plug-ins and languages
    const vsCodeCurrentPluginsPromise = this.vsCodeCurrentPlugins.analyze();
    // Grab plug-ins used in the devfile
    const devfileHasPluginsPromise = this.devfileHandler.hasPlugins();

    // wait that promises are resolved before resolving the defered
    const [featuredList, vsCodeCurrentPluginsLanguages, devfileHasPlugins] = await Promise.all([
      featuredListPromise,
      vsCodeCurrentPluginsPromise,
      devfileHasPluginsPromise,
    ]);
    deferredSetup.resolve({ featuredList, vsCodeCurrentPluginsLanguages, devfileHasPlugins });
  }

  // called after projects are cloned (like the first import)
  async afterClone(): Promise<void> {
    // current workspaces
    const workspaceFolders = theia.workspace.workspaceFolders || [];

    // Grab file extensions used in all projects being in the workspace folder (that have been cloned) (with a timeout)
    const extensionsInCheWorkspace = await this.findFileExtensions.find(workspaceFolders);

    // need to wait all required tasks done when starting the plug-in are finished
    const workspaceAnalysis = await this.deferredSetupPromise;

    // convert found file extensions to languages that should be enabled
    const featurePluginLogicRequest = { ...workspaceAnalysis, extensionsInCheWorkspace };
    const featuredPlugins = await this.featuredPluginLogic.getFeaturedPlugins(featurePluginLogicRequest);

    // do we have plugins in the devfile ?
    if (featuredPlugins.length === 0) {
      return;
    }

    // No devfile plug-ins, we add without asking and we prompt to restart the workspace
    if (!workspaceAnalysis.devfileHasPlugins) {
      await this.installPlugins(featuredPlugins);
    } else {
      // users have existing plug-ins meaning that they probably started with a custom devfile, need to suggest and not add
      const yesValue = 'Yes';
      const yesNoItems: theia.MessageItem[] = [{ title: yesValue }, { title: 'No' }];
      const msg = `Do you want to install the recommended extensions ${featuredPlugins} for your workspace ?`;
      const installOrNotExtensions = await theia.window.showInformationMessage(msg, ...yesNoItems);
      // only if yes we install extensions
      if (installOrNotExtensions && installOrNotExtensions.title === yesValue) {
        await this.installPlugins(featuredPlugins);
      }
    }
  }

  // install given plug-ins
  async installPlugins(featuredPlugins: string[]): Promise<void> {
    try {
      // add plug-ins
      await this.devfileHandler.addPlugins(featuredPlugins);

      // restart the workspace ?
      await this.workspaceHandler.restart(
        `New featured plug-ins ${featuredPlugins} have been added to your workspace to improve the intellisense. Please restart the workspace to see the changes.`
      );
    } catch (error) {
      theia.window.showInformationMessage('Unable to add featured plugins' + error);
    }
  }

  // display recommendation when opening files
  async enableRecommendationPluginWhenOpeningFiles(): Promise<void> {
    const workspaceAnalysis = await this.deferredSetupPromise;
    theia.workspace.onDidOpenTextDocument(document =>
      this.recommendPluginOpenFileLogic.onOpenFile(document, workspaceAnalysis)
    );
  }

  async stop(): Promise<void> {
    // do nothing
  }
}
