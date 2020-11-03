import * as theia from '@theia/plugin';
import { RecommandationPlugin } from './init/recommandation-plugin';
import { InversifyBinding } from './inject/inversify-bindings';

let recommandationPlugin: RecommandationPlugin;

export function start(context: theia.PluginContext) {
    const inversifyBinding = new InversifyBinding();
    const container = inversifyBinding.initBindings();
    recommandationPlugin = container.get(RecommandationPlugin);
    recommandationPlugin.setup(context);

}

export function stop() {
    if (recommandationPlugin) {
        recommandationPlugin.stop()
    }
}
