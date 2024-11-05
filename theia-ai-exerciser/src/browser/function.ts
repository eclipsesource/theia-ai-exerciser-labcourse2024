import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { URI } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { CREATE_FILE_FUNCTION_ID } from './function-name';	

/**
 * A Function that can create a File in the Workspace with specified content.
 */
@injectable()
export class FileCreateFunction implements ToolProvider {
    static ID = CREATE_FILE_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: FileCreateFunction.ID,
            name: FileCreateFunction.ID,
            description: 'Create a file with specified content',
            parameters: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        description: 'The path of the file to create or overwrite',
                    },
                    content: {
                        type: 'string',
                        description: 'The content to write to the file',
                    }
                },
               
            },
            handler: (arg_string: string) => {
                const { file, content } = this.parseArgs(arg_string);
                return this.createFile(file, content);
            }
        };
    }

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    private parseArgs(arg_string: string): { file: string; content: string } {
        return JSON.parse(arg_string);
    }

    private async createFile(file: string, content: string): Promise<string> {
        const uri = new URI(file);
        await this.fileService.write(uri, content);
        return `File created or updated at ${file}`;
    }
}
