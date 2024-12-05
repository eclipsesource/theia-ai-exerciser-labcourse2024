import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { AlertMessage } from '@theia/core/lib/browser/widgets/alert-message';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService, CommandService } from '@theia/core';
import { Message } from '@theia/core/lib/browser';

@injectable()
export class WidgetWidget extends ReactWidget {

    static readonly ID = 'widget:widget';
    static readonly LABEL = 'Widget Widget';

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

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
    }

    render(): React.ReactElement {
        const header = `This is a sample widget which simply calls the messageService
        in order to display an info message to end users.`;
        return <div id='widget-container'>
            <AlertMessage type='INFO' header={header} />
            <button id='displayMessageButton' className='theia-button secondary' title='Display Message' onClick={_a => this.displayMessage()}>Display Message</button>

            <h2>Exercise Management</h2>
            
            <button
                id="createExerciseFilesButton"
                className="theia-button secondary"
                onClick={() =>
                    this.commandService.executeCommand('exerciseCreator:createFiles', {
                        renderSwitch: 'exerciseFiles',
                    })
                }
            >
                Create Exercise Files
            </button>

            <button
                id="createConductorFilesButton"
                className="theia-button secondary"
                onClick={() =>
                    this.commandService.executeCommand('exerciseCreator:createFiles', {
                        renderSwitch: 'conductorFiles',
                    })
                }
            >
                Create Conductor Files
            </button>

            <button
                id="getExerciseListButton"
                className="theia-button secondary"
                onClick={() =>
                    this.commandService.executeCommand('exerciseConductor:getExerciseList')
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
