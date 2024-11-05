/**
 * Generated using theia-extension-generator
 */
import { ContainerModule } from '@theia/core/shared/inversify';
import { TheiaAiExerciserContribution } from './theia-ai-exerciser-contribution';


export default new ContainerModule(bind => {

    // Replace this line with the desired binding, e.g. "bind(CommandContribution).to(TheiaAiExerciserContribution)
    bind(TheiaAiExerciserContribution).toSelf();
});
