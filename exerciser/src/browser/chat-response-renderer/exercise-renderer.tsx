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

    canHandle(response: ChatResponseContent): number {
        if (ExerciseChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: ExerciseChatResponseContent): React.ReactNode {
        const files = response.content.renderSwitch === "exerciseFiles" ? response.content.exerciseFiles:response.content.conductorFiles;

        const createExerciseCallback = async () => {
            this.exerciseService.addExercise({...response.content, exerciseId: generateUuid()})
            this.messageService.info("Exercise created!", { timeout: 3000 });
        }

        return (
            <div style={{display: "flex", flexDirection: "column"}}>
                <ExerciseList files={files} createExerciseCallback={createExerciseCallback}/>
            </div>
        )
    }
}

