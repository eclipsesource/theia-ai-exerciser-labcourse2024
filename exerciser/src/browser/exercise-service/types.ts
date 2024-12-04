export interface ExerciseFile{
    filename: string;
    content: string;
}

export  interface Exercise {
    exerciseId:string;
    exerciseName: string;
    exerciseSummarization: string;
    fileListSummarization: string;
    exerciseFiles: ExerciseFile[];
    conductorFiles: ExerciseFile[];
}
