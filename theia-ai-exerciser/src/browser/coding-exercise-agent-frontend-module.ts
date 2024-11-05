/**
 * Generated using theia-extension-generator
 */

import { ContainerModule } from 'inversify';
import { TheiaAiExerciserContribution } from './coding-exercise-agent';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import { ChatAgent } from '@theia/ai-chat/lib/common';
import { Agent, ToolProvider } from '@theia/ai-core/lib/common';
import { FileContentFunction, GetWorkspaceFileList, FileCreateFunction } from './function';


export default new ContainerModule(bind => {
    // Replace this line with the desired binding, e.g. "bind(CommandContribution).to(TheiaAiExerciserContribution)
    bind(TheiaAiExerciserContribution).toSelf();
    bind(FileService).toSelf().inSingletonScope();
    bind(WorkspaceService).toSelf().inSingletonScope();
    bind(TerminalService).toSelf().inSingletonScope();
    bind(ToolProvider).to(GetWorkspaceFileList);
    bind(ToolProvider).to(FileContentFunction);
    bind(ToolProvider).to(FileCreateFunction);
});
