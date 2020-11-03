import { Container } from 'inversify';
import 'reflect-metadata';
import { apisModule } from '../api/api-module';
import { fetchModule } from '../fetch/fetch-module';
import { findModule } from '../find/find-module';
import { initModule } from '../init/init-module';
import { analyzerModule } from '../analyzer/analyzer-module';


export class InversifyBinding {
    private container: Container;

    constructor() { }

    public initBindings(): Container {
        this.container = new Container();

        this.container.load(analyzerModule);
        this.container.load(apisModule);
        this.container.load(fetchModule);
        this.container.load(findModule);
        this.container.load(initModule);

        return this.container;
    }
}