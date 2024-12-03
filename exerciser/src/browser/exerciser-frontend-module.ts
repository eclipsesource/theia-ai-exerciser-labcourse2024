import { ContainerModule } from 'inversify';
import { ExerciseCreatorAgent } from './exercise-creator/exercise-creator';
import { ChatAgent } from '@theia/ai-chat/lib/common';
import { ExerciseConductorAgent } from './exercise-conductor/exercise-conductor';
import { TerminalChatAgent } from './terminal-chat-agent/terminal-chat-agent';

import { Agent, ToolProvider } from '@theia/ai-core/lib/common';
import { CreateFile } from './utils/tool-functions/create-file';
import { GetFileContent } from './utils/tool-functions/get-file-content';
import { GetWorkspaceFiles } from './utils/tool-functions/get-workspace-files';
import { GetExerciseList } from './utils/tool-functions/get-exercise-list';
import { GetExercise } from './utils/tool-functions/get-exercise';
import { ExerciseService } from './exercise-service';
import {ChatResponsePartRenderer} from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import {CreateExerciseFileRenderer} from "./chat-response-renderer/create-exercise-file-renderer";

export default new ContainerModule(bind => {
    bind(ExerciseCreatorAgent).toSelf().inSingletonScope;
    bind(Agent).toService(ExerciseCreatorAgent);
    bind(ChatAgent).toService(ExerciseCreatorAgent);

    bind(ExerciseConductorAgent).toSelf().inSingletonScope;
    bind(Agent).toService(ExerciseConductorAgent);
    bind(ChatAgent).toService(ExerciseConductorAgent);

    bind(TerminalChatAgent).toSelf().inSingletonScope;
    bind(Agent).toService(TerminalChatAgent);
    bind(ChatAgent).toService(TerminalChatAgent);

    bind(ToolProvider).to(CreateFile);
    bind(ToolProvider).to(GetFileContent);
    bind(ToolProvider).to(GetWorkspaceFiles);
    bind(ToolProvider).to(GetExerciseList);
    bind(ToolProvider).to(GetExercise);
    
    bind(ExerciseService).toSelf().inSingletonScope();

    bind(ChatResponsePartRenderer).to(CreateExerciseFileRenderer).inSingletonScope();
});

