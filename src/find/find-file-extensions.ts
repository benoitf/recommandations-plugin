import * as globby from 'globby';
import { injectable } from 'inversify';
@injectable()
export class FindFileExtensions {

    private static readonly DEFAULT_SCAN_TIME_PER_WORKSPACE_FOLDER: number = 3000;

    find(workspaceFolder: string, timeout: number = FindFileExtensions.DEFAULT_SCAN_TIME_PER_WORKSPACE_FOLDER): Promise<string[]> {
        const fileExtensions: string[] = [];
        const options: globby.GlobbyOptions = {
            gitignore: true,
            cwd: workspaceFolder,
        };
        const entries = [];
        const stream = globby.stream('**/*', options);
        stream.on('data', entry => {
            const fileExtension = entry.slice((entry.lastIndexOf('.') - 1 >>> 0) + 1);
            if (fileExtension.length > 0 && !fileExtensions.includes(fileExtension)) {
                fileExtensions.push(fileExtension);
            }
        });
        // do not let timeout send the event a new time.
        let alreadyStopped = false;
        stream.on('end', () => {
            alreadyStopped = true;
        });
        setTimeout(() => {
            if (!alreadyStopped) {
                stream.emit('end');
                (stream as any).destroy();
            }
        }, timeout)

        return new Promise<string[]>((resolve, reject) => {
            stream.on('end', () => {
                console.log('finished entries = ' + entries.length);
                resolve(fileExtensions);
            });
            stream.on('error', (error) => {
                reject(new Error(error));
            })
        })
    }

    async test2() {
        const fileExtensions = await findFiles.find('/tmp/spring-petclinic', 3000);
        console.log('extensions = ' + fileExtensions);

    }
    test() {
        this.test2();
    }
};

const findFiles = new FindFileExtensions();
findFiles.test();

