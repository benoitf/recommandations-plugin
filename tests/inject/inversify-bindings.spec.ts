/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import 'reflect-metadata';

import { Container } from 'inversify';
import { DevfileHandler } from '../../src/devfile/devfile-handler';
import { FeaturedFetcher } from '../../src/fetch/featured-fetcher';
import { FeaturedPluginLogic } from '../../src/logic/featured-plugin-logic';
import { FindFileExtensions } from '../../src/find/find-file-extensions';
import { InversifyBinding } from '../../src/inject/inversify-bindings';
import { RecommendationPlugin } from '../../src/plugin/recommendation-plugin';
import { VSCodeCurrentPlugins } from '../../src/analyzer/vscode-current-plugins';
import { WorkspaceHandler } from '../../src/workspace/workspace-handler';

describe('Test InversifyBinding', () => {
  test('bindings', async () => {
    const inversifyBinding = new InversifyBinding();
    const container: Container = inversifyBinding.initBindings();

    expect(inversifyBinding).toBeDefined();

    // check analyzer
    const vsCodeCurrentPlugins = container.get(VSCodeCurrentPlugins);
    expect(vsCodeCurrentPlugins).toBeDefined();

    // check devfile
    const devfileHandler = container.get(DevfileHandler);
    expect(devfileHandler).toBeDefined();

    // check fetch
    const featuredFetcher = container.get(FeaturedFetcher);
    expect(featuredFetcher).toBeDefined();

    // check find
    const findFileExtensions = container.get(FindFileExtensions);
    expect(findFileExtensions).toBeDefined();

    // check logic
    const featuredPluginLogic = container.get(FeaturedPluginLogic);
    expect(featuredPluginLogic).toBeDefined();

    // check plugin
    const recommendationPlugin = container.get(RecommendationPlugin);
    expect(recommendationPlugin).toBeDefined();

    // check workspace
    const workspaceHandler = container.get(WorkspaceHandler);
    expect(workspaceHandler).toBeDefined();
  });
});
