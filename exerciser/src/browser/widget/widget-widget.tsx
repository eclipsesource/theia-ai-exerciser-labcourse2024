import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService, CommandService } from '@theia/core';
import { Message } from '@theia/core/lib/browser';
import { ExerciseService } from "../exercise-service";
import { ExerciseOverview } from '../exercise-service/types';
import { ExerciseList } from '../chat-response-renderer/exercise-list';

@injectable()
export class WidgetWidget extends ReactWidget {

    static readonly ID = 'widget:exerciser';
    static readonly LABEL = 'Exerciser';

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    private exerciseList: ExerciseOverview[] = []

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = WidgetWidget.ID;
        this.title.label = WidgetWidget.LABEL;
        this.title.caption = WidgetWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();
        this.getExerciseList();
        this.toDispose.push(
            this.exerciseService.onExerciseChange(event => {
                this.exerciseList = event;
                this.update();
            })
        )
    }
    
    getExerciseList(): void {
        this.exerciseList = this.exerciseService.getExerciseList();
        this.update(); // Trigger a re-render of the widget
    }
    
    render(): React.ReactElement {
        return <div id='widget-container'>
    
            <h2>Exercise List</h2>

            <ExerciseList
                    files={this.exerciseList.map((exercise) => ({
                        fileName: exercise.exerciseName,
                        content: exercise.exerciseSummarization || 'No description available',
                    }))}
                />

            <button
                id="getExerciseListButton"
                className="theia-button secondary"
                onClick={() =>
                    this.getExerciseList()
                }
            >
                Get Exercise List
            </button>
        </div>
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: Widget Widget Successfully Created!');
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }
}
