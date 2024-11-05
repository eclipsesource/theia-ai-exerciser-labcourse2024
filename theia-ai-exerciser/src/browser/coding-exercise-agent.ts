import { injectable, inject } from 'inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import { URI } from '@theia/core';

@injectable()
// Add contribution interface to be implemented, e.g. "TheiaAiExerciserContribution implements CommandContribution"
export class TheiaAiExerciserContribution{
    constructor(
        @inject(FileService) private readonly fileService: FileService,
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
        @inject(TerminalService) private readonly terminalService: TerminalService
    )
        {}

       

        


}