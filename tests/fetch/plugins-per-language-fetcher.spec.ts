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

import * as fs from 'fs-extra';
import * as path from 'path';
import * as theia from '@theia/plugin';

import { Container } from 'inversify';
import { PluginsPerLanguageFetcher } from '../../src/fetch/plugins-per-language-fetcher';
import axios from 'axios';

describe('Test PluginsPerLanguageFetcher', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    jest.mock('axios');
    (axios as any).__clearMock();
    container.bind(PluginsPerLanguageFetcher).toSelf().inSingletonScope();
  });

  test('check with language being there', async () => {
    const json = await fs.readFile(path.join(__dirname, '..', '_data', 'fetch', 'language-go.json'), 'utf8');
    (axios as any).__setContent(`${PluginsPerLanguageFetcher.BASE_JSON_URL}/go.json`, JSON.parse(json));

    const pluginsPerLanguageFetcher = container.get(PluginsPerLanguageFetcher);
    const languagesPerPlugins = await pluginsPerLanguageFetcher.fetch('go');
    expect(languagesPerPlugins).toBeDefined();
    expect(languagesPerPlugins.length).toBe(5);
    const programmingLanguages = languagesPerPlugins.filter(plugin => plugin.category === 'Programming Languages');
    expect(programmingLanguages.length).toBe(1);
    expect(programmingLanguages[0].ids).toEqual(['golang/go/latest']);
  });

  test('check with language not being there', async () => {
    const error = {
      response: {
        status: 404,
      },
    };
    (axios as any).__setError(`${PluginsPerLanguageFetcher.BASE_JSON_URL}/foo.json`, error);
    const pluginsPerLanguageFetcher = container.get(PluginsPerLanguageFetcher);
    const languagesPerPlugins = await pluginsPerLanguageFetcher.fetch('foo');
    expect(languagesPerPlugins).toBeDefined();
    expect(languagesPerPlugins.length).toBe(0);
    expect(theia.window.showInformationMessage as jest.Mock).toBeCalledTimes(0);
  });

  test('unexpected error', async () => {
    const error = {
      response: {
        status: 500,
      },
    };
    (axios as any).__setError(`${PluginsPerLanguageFetcher.BASE_JSON_URL}/java.json`, error);

    const pluginsPerLanguageFetcher = container.get(PluginsPerLanguageFetcher);
    const languagesPerPlugins = await pluginsPerLanguageFetcher.fetch('java');
    // no content
    expect(languagesPerPlugins).toBeDefined();
    expect(languagesPerPlugins.length).toBe(0);
    // notify the user
    expect(theia.window.showInformationMessage as jest.Mock).toBeCalled();
  });
});
