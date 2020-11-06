/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import { ContainerModule, interfaces } from 'inversify';

import { FeaturedPluginLogic } from './featured-plugin-logic';
import { RecommendPluginOpenFileLogic } from './recommend-plugin-open-file-logic';

const featuredModule = new ContainerModule((bind: interfaces.Bind) => {
  bind(FeaturedPluginLogic).toSelf().inSingletonScope();
  bind(RecommendPluginOpenFileLogic).toSelf().inSingletonScope();
});

export { featuredModule };
