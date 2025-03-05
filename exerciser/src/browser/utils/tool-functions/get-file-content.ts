import { inject, injectable } from "@theia/core/shared/inversify";
import { URI } from '@theia/core';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { GET_FILE_CONTENT_FUNCTION_ID } from "./function-names";

@injectable()
export class GetFileContent implements ToolProvider {
    static ID = GET_FILE_CONTENT_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: GetFileContent.ID,
            name: GetFileContent.ID,
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
