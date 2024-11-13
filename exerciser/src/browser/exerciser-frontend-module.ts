import { ContainerModule } from 'inversify';
import { ExerciseCreatorAgent } from './exercise-creator/exercise-creator';
import { ChatAgent } from '@theia/ai-chat/lib/common';
import { ExerciseConductorAgent } from './exercise-conductor/exercise-conductor';

import { Agent, ToolProvider } from '@theia/ai-core/lib/common';
import { CreateFile } from './utils/tool-functions/create-file';
import { GetFileContent } from './utils/tool-functions/get-file-content';
import { GetWorkspaceFiles } from './utils/tool-functions/get-workspace-files';

export default new ContainerModule(bind => {
    bind(ExerciseCreatorAgent).toSelf().inSingletonScope;
    bind(Agent).toService(ExerciseCreatorAgent);
    bind(ChatAgent).toService(ExerciseCreatorAgent);

    bind(ExerciseConductorAgent).toSelf().inSingletonScope;
    bind(Agent).toService(ExerciseConductorAgent);
    bind(ChatAgent).toService(ExerciseConductorAgent);

    bind(ToolProvider).to(CreateFile);
    bind(ToolProvider).to(GetFileContent);
    bind(ToolProvider).to(GetWorkspaceFiles);

});

