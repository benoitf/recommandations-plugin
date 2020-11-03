import * as theia from '@theia/plugin';
import * as che from '@eclipse-che/plugin';
import { inject, injectable } from 'inversify';
import { FeaturedFetcher } from '../fetch/featured-fetcher';
import { FindFileExtensions } from '../find/find-file-extensions';
import { Featured } from '../api/featured';
import { Deferred } from '../util/deferred';
import { VSCodeCurrentPlugins, VSCodeCurrentPluginsLanguages } from '../analyzer/vscode-current-plugins';

@injectable()
export class RecommandationPlugin {

    @inject(FindFileExtensions)
    private findFileExtensions: FindFileExtensions;

    @inject(FeaturedFetcher)
    private featuredFecher: FeaturedFetcher;

    @inject(VSCodeCurrentPlugins)
    private vsCodeCurrentPlugins: VSCodeCurrentPlugins;

    private featuredPluginsPromise: Promise<Featured[]>;

    private currentVSCodePluginsPromise: Promise<VSCodeCurrentPluginsLanguages>;

    private devfilePluginsPromise: Promise<string[]>;

    private deferredSetupPromise: Promise<boolean>;

    async setup(context: theia.PluginContext): Promise<void> {
        // call after projects are cloned
        const workspacePlugin = theia.plugins.getPlugin('Eclipse Che.@eclipse-che/workspace-plugin');
        if (workspacePlugin) {
            workspacePlugin.exports.onDidCloneSources(() => this.afterClone());
        }

        // In parallel, perform the tasks

        // fetch all featured plug-ins from plug-in registry.
        this.featuredPluginsPromise = this.featuredFecher.fetch();
        // grab all plug-ins and languages
        this.currentVSCodePluginsPromise = this.vsCodeCurrentPlugins.analyze();
        // Grab plug-ins used in the devfile
        this.devfilePluginsPromise = this.getDevfilePlugins();

        const deferredSetup = new Deferred<boolean>();
        this.deferredSetupPromise = deferredSetup.promise;

        Promise.all([this.featuredPluginsPromise, this.currentVSCodePluginsPromise, this.devfilePluginsPromise]).then(() => deferredSetup.resolve);

        this.afterClone();
    }

    // called after projects are cloned (like the first import)
    async afterClone(): Promise<void> {

        // current workspaces
        const workspaceFolders = theia.workspace.workspaceFolders || [];

        // need to wait setup finished
        await this.deferredSetupPromise;

        // Grab file extensions (with a timeout)
        const extensionsInCheWorkspace = await this.getFileExtensionsForCurrentCheWorkspace(workspaceFolders);

        // convert found file extensions to languages that should be enabled
        const vsodeCurrentPluginsLanguages = await this.currentVSCodePluginsPromise;
        const foundLanguageIds = extensionsInCheWorkspace.map(fileExtension => vsodeCurrentPluginsLanguages.languagesPerFileExtensions.get(fileExtension) || []).reduce((acc, e) => acc.concat(e), []);

        // Now compare with what we have as plugin-registry recommendations
        const wantedPlugins = foundLanguageIds.map(languageID => vsodeCurrentPluginsLanguages.pluginsPerLanguageID.get(languageID) || []).reduce((acc, e) => acc.concat(e), []);


        //do we have plugins in the devfile ?
        const devfilePlugins = await this.devfilePluginsPromise;
        // no plug-ins
        if (devfilePlugins.length === 0) {
            // make the changes
            theia.window.showInformationMessage('no plug-ins defined, need to install the following plugins' + JSON.stringify(wantedPlugins));
        } else {
            // suggest plug-ins
            theia.window.showInformationMessage('based on the current devfile, need to install the following plugins' + JSON.stringify(wantedPlugins));
        }
    }

    async getDevfilePlugins(): Promise<string[]> {
        // grab all plug-ins from the current devfile
        const cheWorkspace = await che.workspace.getCurrentWorkspace();
        const devfile = cheWorkspace.devfile;
        const devfilePlugins: string[] = [];
        if (devfile && devfile.components) {
            devfile.components.forEach(component => {
                let id = component.id;
                if (id && component.type === 'chePlugin') {
                    if (id.endsWith('/latest')) {
                        id = id.substring(0, id.length - '/latest'.length);
                    }
                    devfilePlugins.push(id);
                }
            })
        }
        return devfilePlugins;

    }



    async getFileExtensionsForCurrentCheWorkspace(workspaceFolders: theia.WorkspaceFolder[]): Promise<string[]> {
        // get extensions for each theia workspace
        const extensions: string[][] = await Promise.all(workspaceFolders.map(workspaceFolder => {
            return this.findFileExtensions.find(workspaceFolder.name);
        }));
        return extensions.reduce((acc, e) => acc.concat(e), []);
    }


    async stop() {

    }


}