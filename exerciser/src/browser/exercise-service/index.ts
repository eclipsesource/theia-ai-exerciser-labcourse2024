import { injectable } from '@theia/core/shared/inversify';

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
@injectable()
export class ExerciseService {
    private exercises: Exercise[] = [];

    

    /**
     * Add a new exercise to the list.
     * @param exercise - The exercise to be added.
     * @returns A boolean indicating success.
     */
    addExercise(exercise: Exercise): boolean {
        this.exercises.push(exercise);
        console.log(`Exercise added: ${exercise.exerciseName}`);
        return true;
    }

    /**
     * Retrieve an exercise by its unique exercise_id.
     * @param exercise_id - The unique ID of the exercise.
     * @returns The exercise with the specified ID, or null if not found.
     */
    getExercise(exercise_id: string): Exercise | null {
        const exercise = this.exercises.find(ex => ex.exerciseId === exercise_id);
        if (!exercise) {
            console.error(`Exercise with ID ${exercise_id} not found.`);
            return null;
        }
        return exercise;
    }

    /**
     * Retrieve a list of all exercise names and summaries.
     * @returns A list of objects containing the name and summary of each exercise.
     */
    getExerciseList(): { id: string; exerciseName: string; exerciseSummary: string }[] {
        return this.exercises.map((exercise) => ({
            id: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            exerciseSummary: exercise.exerciseSummarization,
        }));
    }

    /**
     * Update an existing exercise by its unique exercise_id.
     * @param exercise_id - The unique ID of the exercise to update.
     * @param updatedExercise - The new exercise data to replace the existing one.
     * @returns A boolean indicating success or failure.
     */
    updateExercise(exercise_id: string, updatedExercise: Exercise): boolean {
        const exercise = this.exercises.find(ex => ex.exerciseId === exercise_id);
        if (!exercise) {
            console.error(`Exercise with ID ${exercise_id} not found.`);
            return false;
        }

        // Update the entire exercise object
        Object.assign(exercise, updatedExercise);

        console.log(`Exercise updated: ${updatedExercise.exerciseName}`);
        return true;
    }
}


