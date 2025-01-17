export type TerminalCommandChatResponse = {
    commands: {
        command: string,
        description: string
    }[],
    insertCallback: (command: string) => Promise<void>,
    insertAndRunCallback: (command: string) => Promise<void>,
};
