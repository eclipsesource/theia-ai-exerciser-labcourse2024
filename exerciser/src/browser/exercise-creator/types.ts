export type ExerciseCreatorResponse = {
    exerciseSummarization: string;
    fileListSummarization: string;
    exerciseFiles: fileToBeGenerated[];
    conductorFiles: fileToBeGenerated[];
}

export type fileToBeGenerated = {
    fileName: string;
    content: string;
}
