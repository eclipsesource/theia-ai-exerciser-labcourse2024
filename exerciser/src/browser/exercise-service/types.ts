export interface ExerciseFile{
    fileName: string;
    content: string;
}



export interface ExerciseOverview {
    exerciseId: string;
    exerciseName: string;
    exerciseSummarization: string;

}

export  interface Exercise extends ExerciseOverview{
    
    fileListSummarization: string;
    exerciseFiles: ExerciseFile[];
    conductorFiles: ExerciseFile[];
}