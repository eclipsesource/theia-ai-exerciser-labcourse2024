export type ErrorFeedbackChatResponse = {
    errors: {
        errorTitle: string,
        description: string,
        lines: number[],
    }[],
    highlightLines: (lineNumbers: number[]) => void,
};
