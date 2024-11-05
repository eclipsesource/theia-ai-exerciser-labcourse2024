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

import { AbstractStreamParsingChatAgent, ChatAgent, SystemMessageDescription } from '@theia/ai-chat/lib/common';
import { AgentSpecificVariables, PromptTemplate, ToolInvocationRegistry } from '@theia/ai-core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { codingExerciseTemplate } from './template';
import { FILE_CONTENT_FUNCTION_ID, GET_WORKSPACE_FILE_LIST_FUNCTION_ID, CREATE_FILE_FUNCTION_ID } from './function-name';

@injectable()
export class CodingExerciseAgent extends AbstractStreamParsingChatAgent implements ChatAgent {
    name: string;
    description: string;
    promptTemplates: PromptTemplate[];
    variables: never[];
    readonly agentSpecificVariables: AgentSpecificVariables[];
    readonly functions: string[];

    @inject(ToolInvocationRegistry)
    protected toolInvocationRegistry: ToolInvocationRegistry;

    constructor() {
        super('CodingExercise', [{
            purpose: 'chat',
            identifier: 'openai/gpt-4o',
        }], 'chat');
        
        // Set the agent name and description for coding exercises
        this.name = 'CodingExercise';
        this.description = 'This agent assists with coding exercises by providing code snippets, explanations, and guidance. \
    It can execute code snippets, evaluate results, and answer questions related to coding challenges.';

        // Define the prompt template and variables specific to coding exercises
        this.promptTemplates = [codingExerciseTemplate];
        this.variables = [];
        this.agentSpecificVariables = [];
        
        // Register functions relevant for coding exercises, including file access and code execution
        this.functions = [GET_WORKSPACE_FILE_LIST_FUNCTION_ID, FILE_CONTENT_FUNCTION_ID, CREATE_FILE_FUNCTION_ID];
    }

    protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
        const resolvedPrompt = await this.promptService.getPrompt(codingExerciseTemplate.id);
        return resolvedPrompt ? SystemMessageDescription.fromResolvedPromptTemplate(resolvedPrompt) : undefined;
    }
}
