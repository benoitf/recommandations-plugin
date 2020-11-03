import AxiosInstance from 'axios';
import { Featured } from '../api/featured';
import * as theia from '@theia/plugin';
import { injectable } from 'inversify';

@injectable()
export class FeaturedFetcher {

    async fetch(): Promise<Featured[]> {
        let featuredList: Featured[] = [];
        // need to fetch
        try {
            const response = await AxiosInstance.get(`https://gist.githubusercontent.com/benoitf/aa55b92ec12fb7436d6bacbad60e95d5/raw/featured.json`);
            featuredList = response.data.featured;
        } catch (error) {
            featuredList = [];
            theia.window.showInformationMessage(`Error while fetching featured recommandation ${error}`);
        }
        return featuredList;
    }
}