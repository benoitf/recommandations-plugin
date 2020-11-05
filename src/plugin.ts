/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import 'reflect-metadata';

import { InversifyBinding } from './inject/inversify-bindings';
import { RecommandationPlugin } from './plugin/recommandation-plugin';

let recommandationPlugin: RecommandationPlugin;

export function start(): void {
  const inversifyBinding = new InversifyBinding();
  const container = inversifyBinding.initBindings();
  recommandationPlugin = container.get(RecommandationPlugin);
  recommandationPlugin.start();
}

export function stop(): void {
  if (recommandationPlugin) {
    recommandationPlugin.stop();
  }
}
