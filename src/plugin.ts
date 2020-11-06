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

import { InversifyBinding } from './inject/inversify-bindings';
import { RecommendationPlugin } from './plugin/recommendation-plugin';

let recommendationPlugin: RecommendationPlugin;

export function start(): void {
  const inversifyBinding = new InversifyBinding();
  const container = inversifyBinding.initBindings();
  recommendationPlugin = container.get(RecommendationPlugin);
  recommendationPlugin.start();
}

export function stop(): void {
  if (recommendationPlugin) {
    recommendationPlugin.stop();
  }
}
