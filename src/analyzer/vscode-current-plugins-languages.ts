/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
export interface VSCodeCurrentPluginsLanguages {
  // Map between file extension and language ID
  languagesPerFileExtensions: Map<string, string[]>;

  // Map between a language ID and the plugin's IDs
  pluginsPerLanguageID: Map<string, string[]>;
}
