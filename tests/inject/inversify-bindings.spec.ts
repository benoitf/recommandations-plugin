/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
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
import { PluginsPerLanguageFetcher } from '../../src/fetch/plugins-per-language-fetcher';
import { RecommendPluginOpenFileLogic } from '../../src/logic/recommend-plugin-open-file-logic';
import { RecommendationPlugin } from '../../src/plugin/recommendation-plugin';
import { VSCodeCurrentPlugins } from '../../src/analyzer/vscode-current-plugins';
import { WorkspaceHandler } from '../../src/workspace/workspace-handler';

describe('Test InversifyBinding', () => {
  test('bindings', async () => {
    const inversifyBinding = new InversifyBinding();
    const container: Container = inversifyBinding.initBindings();

    expect(inversifyBinding).toBeDefined();

    // check analyzer
    expect(container.get(VSCodeCurrentPlugins)).toBeDefined();

    // check devfile
    expect(container.get(DevfileHandler)).toBeDefined();

    // check fetch
    expect(container.get(FeaturedFetcher)).toBeDefined();
    expect(container.get(PluginsPerLanguageFetcher)).toBeDefined();

    // check find
    expect(container.get(FindFileExtensions)).toBeDefined();

    // check logic
    expect(container.get(FeaturedPluginLogic)).toBeDefined();
    expect(container.get(RecommendPluginOpenFileLogic)).toBeDefined();

    // check plugin
    expect(container.get(RecommendationPlugin)).toBeDefined();

    // check workspace
    expect(container.get(WorkspaceHandler)).toBeDefined();
  });
});
