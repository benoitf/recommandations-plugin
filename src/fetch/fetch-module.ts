import { ContainerModule, interfaces } from 'inversify';
import { FeaturedFetcher } from './featured-fetcher';

const fetchModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(FeaturedFetcher).toSelf().inSingletonScope();
});

export { fetchModule };
