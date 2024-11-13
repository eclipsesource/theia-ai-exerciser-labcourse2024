import { inject, injectable } from "@theia/core/shared/inversify";
import { URI } from '@theia/core';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { GET_WORKSPACE_FILES_FUNCTION_ID } from "./function-names";

@injectable()
export class GetWorkspaceFiles implements ToolProvider {
    static ID = GET_WORKSPACE_FILES_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: GetWorkspaceFiles.ID,
            name: GetWorkspaceFiles.ID,
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
