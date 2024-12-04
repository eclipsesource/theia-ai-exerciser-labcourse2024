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


import {injectable} from "@theia/core/shared/inversify";
import {ChatResponsePartRenderer} from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import {ChatResponseContent} from "@theia/ai-chat";
import * as React from '@theia/core/shared/react';
import {ExerciseCreatorResponse} from "../types";
import {FileList} from "./FileList";

export interface CreateExerciseChatResponseContent
    extends ChatResponseContent {
    kind: 'createExerciseFile';
    content: ExerciseCreatorResponse;
}

export class CreateExerciseChatResponseContentImpl implements CreateExerciseChatResponseContent {
    readonly kind = 'createExerciseFile';
    protected _content: ExerciseCreatorResponse;

    constructor(content: ExerciseCreatorResponse) {
        this._content = content;
    }

    get content(): ExerciseCreatorResponse {
        return this._content;
    }

    asString(): string {
        return JSON.stringify(this._content);
    }

    merge(nextChatResponseContent: CreateExerciseChatResponseContent): boolean {
        this._content = {...this._content, ...nextChatResponseContent.content};
        return true;
    }
}

export namespace CreateExerciseChatResponseContent {
    export function is(obj: unknown): obj is CreateExerciseChatResponseContent {
        return (
            ChatResponseContent.is(obj) &&
            obj.kind === 'createExerciseFile' &&
            'content' in obj &&
            typeof (obj as { content: ExerciseCreatorResponse }).content === "object"
        );
    }
}

@injectable()
export class CreateExerciseRenderer implements ChatResponsePartRenderer<CreateExerciseChatResponseContent> {
    canHandle(response: ChatResponseContent): number {
        if (CreateExerciseChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: CreateExerciseChatResponseContent): React.ReactNode {
        return (
            <div style={{display: "flex", flexDirection: "column"}}>
                <FileList files={response.content.exerciseFiles}/>
            </div>
        )
    }
}

