import { ContainerModule, interfaces } from 'inversify';
import { VSCodeCurrentPlugins } from './vscode-current-plugins';


const analyzerModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(VSCodeCurrentPlugins).toSelf().inSingletonScope();
});

export { analyzerModule };
