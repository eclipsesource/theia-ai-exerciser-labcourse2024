import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService, CommandService } from '@theia/core';
import { codicon, Message } from '@theia/core/lib/browser';
import { ExerciseService } from "../exercise-service";
import { Exercise } from '../exercise-service/types';
import { ExerciseList } from './widget-renderer/exercise-list';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import {
   AI_CHAT_NEW_CHAT_WINDOW_WITH_PINNED_AGENT_COMMAND
} from "@theia/ai-chat-ui/lib/browser/chat-view-commands";
import { AI_CHAT_TOGGLE_COMMAND_ID } from "@theia/ai-chat-ui/lib/browser/ai-chat-ui-contribution";
import { ChatAgentService } from "@theia/ai-chat";
import { ImportExerciseButton } from "./widget-renderer/import-exercise-button";

@injectable()
export class ExerciserWidget extends ReactWidget {

    static readonly ID = 'widget:exerciser';
    static readonly LABEL = 'Exerciser';

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(ChatAgentService)
    protected chatAgentService: ChatAgentService;

    private exerciseList: Exercise[] = []

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = ExerciserWidget.ID;
        this.title.label = ExerciserWidget.LABEL;
        this.title.caption = ExerciserWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = codicon('code');
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
    async fileCreation(exercise: Exercise): Promise<void> {
        const wsRoots = await this.workspaceService.roots;

        if (wsRoots.length === 0) {
            console.error(`No workspace found to create files.`);
        }

        // Use the first workspace root as the base directory
        const rootUri = wsRoots[0].resource;

        // Create the exercise folder
        const exerciseFolderUri = rootUri.resolve(exercise.exerciseName);
        await this.fileService.createFolder(exerciseFolderUri);

        // Iterate over conductorFiles and create files in the exercise folder
        exercise.conductorFiles.forEach(async (conductorFile) => {
            const fileUri = exerciseFolderUri.resolve(conductorFile.fileName);
            await this.fileService.write(fileUri, conductorFile.content);
        });
    }
    async createConductorFile(exerciseId:string): Promise<void> {
        const exerise= this.exerciseService.getExercise(exerciseId);
        if(exerise){
             await this.fileCreation(exerise);
             this.messageService.info('Exercise files created successfully', { timeout: 3000 });
        }else{
            console.error(`Exercise with ID ${exerciseId} not found.`);
        }
    }

    async removeExercise(exerciseId:string): Promise<void> {
        const isRemoved= this.exerciseService.removeExercise(exerciseId);
        if(!isRemoved){
            this.messageService.error('Error while removing exercise', { timeout: 3000 });
        }
        this.messageService.info('Exercise removed', { timeout: 3000 });
        this.update();
    }

    render(): React.ReactElement {
        // TODO - not working if undefined is not passed as first argument
        const handleChatRedirection = async (agent: "ExerciseCreator" | "ExerciseConductor") => {
            const chatAgent = this.chatAgentService.getAgent(agent);
            this.commandService.executeCommand(AI_CHAT_TOGGLE_COMMAND_ID)
            this.commandService.executeCommand(AI_CHAT_NEW_CHAT_WINDOW_WITH_PINNED_AGENT_COMMAND.id, undefined, chatAgent)
        }

        const handleImportExercise = (exercise: Exercise) => {
            this.exerciseService.addExercise(exercise);
        }

        return <div id='widget-container' style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            marginRight: 20,
            marginLeft: 20,
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <h2>Exercise List</h2>
                <ImportExerciseButton handleImportExercise={handleImportExercise}/>
            </div>
            <ExerciseList
                exercises={this.exerciseList}
                createExerciseFile = {this.createConductorFile.bind(this)}
                removeExercise = {this.removeExercise.bind(this)}
            />
            <div style={{flexGrow: 1}}/>
            <div style={{
                alignSelf: "end",
                paddingTop: 20,
                paddingBottom: 20,
                display: "flex",
            }}>
                <button className={"theia-button main"} onClick={() => handleChatRedirection("ExerciseCreator")}>Exercise Creator</button>
                <button className={"theia-button main"} onClick={() => handleChatRedirection("ExerciseConductor")}>Exercise Conductor</button>
            </div>
        </div>
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: Exerciser Widget Successfully Created!', { timeout: 3000 });
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }
}
