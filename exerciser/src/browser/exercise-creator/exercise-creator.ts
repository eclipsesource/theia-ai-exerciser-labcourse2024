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

import {
    AbstractStreamParsingChatAgent,
    ChatAgent,
    ErrorChatResponseContentImpl,
    SystemMessageDescription
} from '@theia/ai-chat/lib/common';
import {
    AgentSpecificVariables,
    getTextOfResponse,
    LanguageModelResponse,
    PromptTemplate,
    ToolInvocationRegistry
} from '@theia/ai-core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { exerciseCreatorTemplate } from "./template";
import { CREATE_FILE_FUNCTION_ID, GET_FILE_CONTENT_FUNCTION_ID, GET_WORKSPACE_FILES_FUNCTION_ID } from '../utils/tool-functions/function-names';
import {ILogger} from "@theia/core";
import {
    ChatRequestModelImpl, CommandChatResponseContentImpl,
    CustomCallback,
    MarkdownChatResponseContentImpl
} from "@theia/ai-chat";
import {ExerciseCreatorResponse} from "./types";
import {WorkspaceService} from "@theia/workspace/lib/browser";
import {FileService} from "@theia/filesystem/lib/browser/file-service";
import {
    CreateExerciseFileChatResponseContentImpl
} from "../chat-response-renderer/create-exercise-file-renderer";

@injectable()
export class ExerciseCreatorAgent extends AbstractStreamParsingChatAgent implements ChatAgent {
    name: string;
    description: string;
    promptTemplates: PromptTemplate[];
    variables: never[];
    readonly agentSpecificVariables: AgentSpecificVariables[];
    readonly functions: string[];

    @inject(ToolInvocationRegistry)
    protected toolInvocationRegistry: ToolInvocationRegistry;

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    constructor() {
        super('ExerciseCreator', [{
            purpose: 'chat',
            identifier: 'openai/gpt-4o',
        }], 'chat');

        // Set the agent name and description for coding exercises
        this.name = 'ExerciseCreator';
        this.description = 'This agent assists with creating custom coding exercises on user requests. It previews file structures, confirms exercise design, and generates instructional files upon approval. \
            The assistant provides clear guidance, explanations, and encourages hands-on coding and experimentation.';

        // Define the prompt template and variables specific to coding exercises
        this.promptTemplates = [exerciseCreatorTemplate];
        this.variables = [];
        this.agentSpecificVariables = [];

        // Register functions relevant for coding exercises, including file access and code execution
        this.functions = [CREATE_FILE_FUNCTION_ID, GET_FILE_CONTENT_FUNCTION_ID, GET_WORKSPACE_FILES_FUNCTION_ID];
    }

    protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
        const resolvedPrompt = await this.promptService.getPrompt(exerciseCreatorTemplate.id);
        return resolvedPrompt ? SystemMessageDescription.fromResolvedPromptTemplate(resolvedPrompt) : undefined;
    }

    protected override async addContentsToResponse(response: LanguageModelResponse, request: ChatRequestModelImpl): Promise<void> {
        const responseText = await getTextOfResponse(response);
        const jsonRegex = /{[\s\S]*}/;
        const jsonMatch = responseText.match(jsonRegex);
        if (jsonMatch) {
            const jsonString = jsonMatch[0];
            const beforeJson = responseText.slice(0, jsonMatch.index!);
            request.response.response.addContent(new MarkdownChatResponseContentImpl(beforeJson));
            try {
                const exerciseCreatorResponse: ExerciseCreatorResponse = JSON.parse(jsonString);
                /*
                exerciseCreatorResponse.exerciseFiles.forEach(exerciseFile => {
                    request.response.response.addContent(new CodeChatResponseContentImpl(exerciseFile.content));
                })
                */
                request.response.response.addContent(new CreateExerciseFileChatResponseContentImpl(exerciseCreatorResponse));

                const generateFileChatResponse = this.filesToBeGenerated(exerciseCreatorResponse);
                generateFileChatResponse && request.response.response.addContent(generateFileChatResponse);
            } catch (error) {
                request.response.response.addContent(new ErrorChatResponseContentImpl(new Error("Error while parsing files")));
            }
        } else {
            request.response.response.addContent(new MarkdownChatResponseContentImpl(responseText));
        }
    }

    filesToBeGenerated(exerciseCreatorResponse: ExerciseCreatorResponse) {
        const customCallback: CustomCallback = {
            label: 'Create Files',
            callback: async () => {
                const wsRoots = await this.workspaceService.roots;
                for (const fileToBeGenerated of exerciseCreatorResponse.exerciseFiles) {
                    const rootUri = wsRoots[0].resource;
                    const fileUri = rootUri.resolve(fileToBeGenerated.fileName);
                    await this.fileService.write(fileUri, fileToBeGenerated.content);
                }
                for (const fileToBeGenerated of exerciseCreatorResponse.conductorFiles) {
                    const rootUri = wsRoots[0].resource;
                    const fileUri = rootUri.resolve(fileToBeGenerated.fileName);
                    await this.fileService.write(fileUri, fileToBeGenerated.content);
                }
            }
        };
        return new CommandChatResponseContentImpl({id: 'custom-command'}, customCallback);
    }
}
