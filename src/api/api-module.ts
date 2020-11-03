import { ContainerModule, interfaces } from 'inversify';


const apisModule = new ContainerModule((bind: interfaces.Bind) => {
    // bind(AddMilestoneHelper).toSelf().inSingletonScope();
});

export { apisModule };
