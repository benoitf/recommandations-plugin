import * as theia from '@theia/plugin';
import { injectable } from 'inversify';

export interface LanguageInformation {
    id: string;
    fileExtensions: string[];
    extensions: string[];
    workspaceContains: string[];

}

export interface VSCodeCurrentPluginsLanguages {
    // Map between file extension and language ID
    languagesPerFileExtensions: Map<string, string[]>;

    // Map between a language ID and the plugin's IDs
    pluginsPerLanguageID: Map<string, string[]>;
}


@injectable()
export class VSCodeCurrentPlugins {


    async analyze(): Promise<VSCodeCurrentPluginsLanguages> {

        // Map between file extension and language ID
        const languagesPerFileExtensions = new Map<string, string[]>();

        // Map between a language ID and the plugin's IDs
        const pluginsPerLanguageID = new Map<string, string[]>();


        theia.plugins.all.forEach(plugin => {

            // populate map between a file extension and the language ID
            const contributes = plugin.packageJSON.contributes || { languages: [] };
            const languages: LanguageInformation[] = contributes.languages || [];
            languages.forEach(language => {
                const languageID = language.id;
                if (languageID) {
                    const fileExtensions = language.extensions || [];
                    fileExtensions.forEach(fileExtension => {
                        let existingLanguageIds = languagesPerFileExtensions.get(fileExtension);
                        if (!existingLanguageIds) {
                            existingLanguageIds = [];
                            languagesPerFileExtensions.set(fileExtension, existingLanguageIds);
                        }
                        if (!existingLanguageIds.includes(languageID)) {
                            existingLanguageIds.push(languageID);
                        }
                    })
                }
            });

            // populate map between a language ID anda plug-in's ID
            const activationEvents: string[] = plugin.packageJSON.activationEvents || [];
            activationEvents.forEach(activationEvent => {
                if (activationEvent.startsWith('onLanguage:')) {
                    const languageID = activationEvent.substring('onLanguage:'.length);
                    let existingPlugins = pluginsPerLanguageID.get(languageID);
                    if (!existingPlugins) {
                        existingPlugins = [];
                        pluginsPerLanguageID.set(languageID, existingPlugins);
                    }
                    if (!existingPlugins.includes(plugin.id)) {
                        existingPlugins.push(plugin.id);
                    }
                }
            })
        });

        return { languagesPerFileExtensions, pluginsPerLanguageID };
    }

}