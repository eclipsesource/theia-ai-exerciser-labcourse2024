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

import { inject, injectable } from "@theia/core/shared/inversify";
import { ChatResponsePartRenderer } from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import { ChatResponseContent } from "@theia/ai-chat";
import * as React from '@theia/core/shared/react';
import { UntitledResourceResolver } from '@theia/core';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { ErrorFeedbackChatResponse } from "../exercise-conductor/types";

export interface ErrorFeedbackChatResponseContent
    extends ChatResponseContent {
    kind: "error-feedback"
    content: ErrorFeedbackChatResponse;
}

export class ErrorFeedbackChatResponseContentImpl implements ErrorFeedbackChatResponseContent {
    readonly kind = 'error-feedback';
    protected _content: ErrorFeedbackChatResponse;

    constructor(content: ErrorFeedbackChatResponse) {
        this._content = content;
    }

    get content(): ErrorFeedbackChatResponse {
        return this._content;
    }

    asString(): string {
        return JSON.stringify(this._content);
    }

    merge(nextChatResponseContent: ErrorFeedbackChatResponseContent): boolean {
        this._content = { ...this._content, ...nextChatResponseContent.content };
        return true;
    }
}

export namespace ErrorFeedbackChatResponseContent {
    export function is(obj: unknown): obj is ErrorFeedbackChatResponseContent {
        return (
            ChatResponseContent.is(obj) &&
            obj.kind === 'error-feedback' &&
            'content' in obj &&
            typeof (obj as { content: ErrorFeedbackChatResponse }).content === "object"
        );
    }
}

@injectable()
export class ErrorFeedbackRenderer implements ChatResponsePartRenderer<ErrorFeedbackChatResponseContent> {

    @inject(MonacoEditorProvider)
    protected readonly editorProvider: MonacoEditorProvider;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;

    canHandle(response: ChatResponseContent): number {
        if (ErrorFeedbackChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: ErrorFeedbackChatResponseContent): React.ReactNode {
        const style = {
            backgroundColor: "#1e1e1e", // Dark background like VS Code
            color: "#d7ba7d", // Light gray text
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #3c3c3c",
            height: "auto", // Fixed height

        }   
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {response.content.errors.map((item,index) => {
                    return (
                        <div key={item.errorTitle}>
                            <div style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 10
                            }}>
                                <p style={{ flexGrow: 1,fontWeight:"bold", fontSize:"14px"}}>{index+1}. {item.errorTitle}</p>
                                {item.lines?.length>0 && <span
                                    className="codicon codicon-issues"
                                    title="show the problem in the editor"
                                    onClick={() => response.content.highlightLines(item.lines)}
                                />}

                            </div>
                            <div className="theia-CodePartRenderer-bottom">
                                <div style={style}>
                                    <span >{item.description}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
}


/*

 */
