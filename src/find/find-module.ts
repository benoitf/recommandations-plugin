import { ContainerModule, interfaces } from 'inversify';
import { FindFileExtensions } from './find-file-extensions';

const findModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(FindFileExtensions).toSelf().inSingletonScope();
});

export { findModule };
