import { inject, injectable } from "@theia/core/shared/inversify";
import { URI } from '@theia/core';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { CREATE_FILE_FUNCTION_ID } from "./function-names";


@injectable()
export class CreateFile implements ToolProvider {
    static ID = CREATE_FILE_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: CreateFile.ID,
            name: CreateFile.ID,
            description: 'Create a file with specified content',
            parameters: {
                type: 'object',
                properties: {
                    fileName: {
                        type: 'string',
                        description: 'The name of the file to create or overwrite',
                    },
                    fileDir: {
                        type: 'string',
                        description: 'The directory where the file should be created',
                    },
                    content: {
                        type: 'string',
                        description: 'The content to write to the file',
                    }
                },
            },
            handler: (arg_string: string) => {
                const { fileName, fileDir, content } = this.parseArgs(arg_string);
                return this.createFile(fileName, fileDir, content);
            }
        };
    }

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    private parseArgs(arg_string: string): { fileName: string; fileDir: string; content: string } {
        return JSON.parse(arg_string);
    }

    private async createFile(fileName: string, fileDir: string, content: string): Promise<string> {

        const wsRoots = await this.workspaceService.roots;
        if(!fileDir){
            if(wsRoots.length !== 0) {
                const rootUri = wsRoots[0].resource;
                const fileUri = rootUri.resolve(fileName);
                await this.fileService.write(fileUri, content);
                return `File created at ${fileUri.toString()}`;
            }else{
                return `No workspace found to create file`;
            }
        }else{

            const fileDirUri = new URI(fileDir);
            const fileUri = fileDirUri.resolve(fileName);
            await this.fileService.write(fileUri, content);
            return `File created or updated at ${fileUri.toString()}`;
        }        
    }
}
