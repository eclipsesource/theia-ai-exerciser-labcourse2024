import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { URI } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { CREATE_FILE_FUNCTION_ID } from './function-name';
import { FILE_CONTENT_FUNCTION_ID, GET_WORKSPACE_FILE_LIST_FUNCTION_ID } from './function-name';
import { FileStat } from '@theia/filesystem/lib/common/files';
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


@injectable()
export class FileContentFunction implements ToolProvider {
    static ID = FILE_CONTENT_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: FileContentFunction.ID,
            name: FileContentFunction.ID,
            description: 'Get the content of the file',
            parameters: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        description: 'The path of the file to retrieve content for',
                    }
                }
            },
            handler: (arg_string: string) => {
                const file = this.parseArg(arg_string);
                return this.getFileContent(file);
            }
        };
    }

    @inject(WorkspaceService)
    protected workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    private parseArg(arg_string: string): string {
        const result = JSON.parse(arg_string);
        return result.file;
    }

    private async getFileContent(file: string): Promise<string> {
        const uri = new URI(file);
        const fileContent = await this.fileService.read(uri);
        return fileContent.value;
    }

}

/**
 * A Function that lists all files in the workspace.
 */
@injectable()
export class GetWorkspaceFileList implements ToolProvider {
    static ID = GET_WORKSPACE_FILE_LIST_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: GetWorkspaceFileList.ID,
            name: GetWorkspaceFileList.ID,
            description: 'List all files in the workspace',

            handler: () => this.getProjectFileList()
        };
    }

    @inject(WorkspaceService)
    protected workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    async getProjectFileList(): Promise<string[]> {
        // Get all files from the workspace service as a flat list of qualified file names
        const wsRoots = await this.workspaceService.roots;
        const result: string[] = [];
        for (const root of wsRoots) {
            result.push(...await this.listFilesRecursively(root.resource));
        }
        return result;
    }

    private async listFilesRecursively(uri: URI): Promise<string[]> {
        const stat = await this.fileService.resolve(uri);
        const result: string[] = [];
        if (stat && stat.isDirectory) {
            if (this.exclude(stat)) {
                return result;
            }
            const children = await this.fileService.resolve(uri);
            if (children.children) {
                for (const child of children.children) {
                    result.push(child.resource.toString());
                    result.push(...await this.listFilesRecursively(child.resource));
                }
            }
        }
        return result;
    }

    // Exclude folders which are not relevant to the AI Agent
    private exclude(stat: FileStat): boolean {
        if (stat.resource.path.base.startsWith('.')) {
            return true;
        }
        if (stat.resource.path.base === 'node_modules') {
            return true;
        }
        if (stat.resource.path.base === 'lib') {
            return true;
        }
        return false;
    }
}
