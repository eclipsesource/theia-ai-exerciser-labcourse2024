import { injectable, inject } from '@theia/core/shared/inversify';
import { MenuModelRegistry } from '@theia/core';
import { ExerciserWidget } from './exerciser-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { ExerciseService } from '../exercise-service';
import { ExerciseCreatorChatAgent } from '../exercise-creator';
import { ExerciseConductorAgent } from '../exercise-conductor/exercise-conductor';

export const WidgetCommand: Command = { id: 'widget:command' };

export const CreateFilesCommand: Command = {
    id: 'exerciseCreator:createFiles',
    label: 'Create Files',
};

export const GetExerciseListCommand: Command = {
    id: 'exerciseConductor:getExerciseList',
    label: 'Get Exercise List',
};


@injectable()
export class WidgetContribution extends AbstractViewContribution<ExerciserWidget> {

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    @inject(ExerciseCreatorChatAgent)
    protected readonly exerciseCreatorAgent: ExerciseCreatorChatAgent;

    @inject(ExerciseConductorAgent)
    protected readonly exerciseConductorAgent: ExerciseConductorAgent;

    /**
     * `AbstractViewContribution` handles the creation and registering
     *  of the widget including commands, menus, and keybindings.
     *
     * We can pass `defaultWidgetOptions` which define widget properties such as
     * its location `area` (`main`, `left`, `right`, `bottom`), `mode`, and `ref`.
     *
     */
    constructor() {
        super({
            widgetId: ExerciserWidget.ID,
            widgetName: ExerciserWidget.LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: WidgetCommand.id
        });
    }

    /**
     * Example command registration to open the widget from the menu, and quick-open.
     * For a simpler use case, it is possible to simply call:
     ```ts
        super.registerCommands(commands)
     ```
     *
     * For more flexibility, we can pass `OpenViewArguments` which define
     * options on how to handle opening the widget:
     *
     ```ts
        toggle?: boolean
        activate?: boolean;
        reveal?: boolean;
     ```
     *
     * @param commands
     */
    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(WidgetCommand, {
            execute: () => super.openView({ activate: false, reveal: true })
        });

        commands.registerCommand(CreateFilesCommand, {
            execute: async (args: { renderSwitch: 'exerciseFiles' | 'conductorFiles' }) => {
                const { renderSwitch } = args;
                console.log(`Creating files with renderSwitch: ${renderSwitch}`);
            }
        });

        commands.registerCommand(GetExerciseListCommand, {
            execute: async () => {
                const exerciseList = await this.exerciseService.getExerciseList();
                console.log('Exercise List:', exerciseList);
            }
        });

        super.registerCommands(commands);
    }

    /**
     * Example menu registration to contribute a menu item used to open the widget.
     * Default location when extending the `AbstractViewContribution` is the `View` main-menu item.
     *
     * We can however define new menu path locations in the following way:
     ```ts
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: 'id',
            label: 'label'
        });
     ```
     *
     * @param menus
     */
    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
    }
}
