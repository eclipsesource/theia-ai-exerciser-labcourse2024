// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import {inject, injectable} from "@theia/core/shared/inversify";
import {ChatResponsePartRenderer} from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import {ChatResponseContent} from "@theia/ai-chat";
import * as React from '@theia/core/shared/react';
import {ExerciseChatResponse} from "../exercise-creator/types";
import {ExerciseList} from "./exercise-list";
import {generateUuid, MessageService} from "@theia/core";
import {ExerciseService} from "../exercise-service";
import {Exercise} from "../exercise-service/types";
import {FileService} from "@theia/filesystem/lib/browser/file-service";
import {WorkspaceService} from "@theia/workspace/lib/browser";
import { UntitledResourceResolver } from '@theia/core';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';

export interface ExerciseChatResponseContent
    extends ChatResponseContent {
    kind: 'exercise';
    content: ExerciseChatResponse;
}

export class ExerciseChatResponseContentImpl implements ExerciseChatResponseContent {
    readonly kind = 'exercise';
    protected _content: ExerciseChatResponse;

    constructor(content: ExerciseChatResponse) {
        this._content = content;
    }

    get content(): ExerciseChatResponse {
        return this._content;
    }

    asString(): string {
        return JSON.stringify(this._content);
    }

    merge(nextChatResponseContent: ExerciseChatResponseContent): boolean {
        this._content = {...this._content, ...nextChatResponseContent.content};
        return true;
    }
}

export namespace ExerciseChatResponseContent {
    export function is(obj: unknown): obj is ExerciseChatResponseContent {
        return (
            ChatResponseContent.is(obj) &&
            obj.kind === 'exercise' &&
            'content' in obj &&
            typeof (obj as { content: ExerciseChatResponse }).content === "object"
        );
    }
}

@injectable()
export class ExerciseRenderer implements ChatResponsePartRenderer<ExerciseChatResponseContent> {

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(MonacoEditorProvider)
    protected readonly editorProvider: MonacoEditorProvider;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;

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

    canHandle(response: ChatResponseContent): number {
        if (ExerciseChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: ExerciseChatResponseContent): React.ReactNode {
        const caller = response.content.renderSwitch === "exerciseFiles" ? "creator" : "conductor";

        const generateExerciseFileCallback = async () => {
            const exerise= this.exerciseService.getExercise(response.content.exerciseId);
            if(exerise){
                await this.fileCreation(exerise);
                this.messageService.info('Exercise files generated successfully', { timeout: 3000 });
            }else{
                console.error(`Exercise with ID ${response.content.exerciseId} not found.`);
            }
        }

        const createExerciseCallback = async () => {
            this.exerciseService.addExercise({...response.content, exerciseId: generateUuid()})
            this.messageService.info("Exercise created!", { timeout: 3000 });
        }

        return (
            <div style={{display: "flex", flexDirection: "column"}}>
                <ExerciseList
                    type={caller}
                    files={caller === "creator" ? [...response.content.exerciseFiles, ...response.content.conductorFiles] : response.content.conductorFiles}
                    buttonContent={caller === "creator" ? "Create Exercise" : "Generate Exercise to Workspace"}
                    callback={caller === "creator" ? createExerciseCallback : generateExerciseFileCallback}
                    untitledResourceResolver={this.untitledResourceResolver}
                    editorProvider={this.editorProvider}
                />
            </div>
        )
    }
}

