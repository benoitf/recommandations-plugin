/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import 'reflect-metadata';

import * as plugin from '../src/plugin';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from 'inversify';
import { InversifyBinding } from '../src/inject/inversify-bindings';
import { RecommandationPlugin } from '../src/plugin/recommandation-plugin';

describe('Test Plugin', () => {
  jest.mock('../src/inject/inversify-bindings');
  let oldBindings: any;
  let initBindings: jest.Mock;

  beforeEach(() => {
    oldBindings = InversifyBinding.prototype.initBindings;
    initBindings = jest.fn();
    InversifyBinding.prototype.initBindings = initBindings;
  });

  afterEach(() => {
    InversifyBinding.prototype.initBindings = oldBindings;
  });

  test('basics', async () => {
    const container = new Container();
    const morecommandationPluginMock = { start: jest.fn(), stop: jest.fn() };
    container.bind(RecommandationPlugin).toConstantValue(morecommandationPluginMock as any);
    initBindings.mockReturnValue(container);

    // try stop before start, it should not call the plug-in
    plugin.stop();
    expect(morecommandationPluginMock.stop).toBeCalledTimes(0);

    plugin.start();
    plugin.stop();
    expect(morecommandationPluginMock.start).toBeCalled();
    expect(morecommandationPluginMock.stop).toBeCalled();
  });
});
