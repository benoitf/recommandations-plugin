import { ContainerModule, interfaces } from 'inversify';
import { RecommandationPlugin } from './recommandation-plugin';

const initModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(RecommandationPlugin).toSelf().inSingletonScope();
});

export { initModule };
