import { injectable } from '@theia/core/shared/inversify';

@injectable()
export interface ExerciseFile{
    filename: string;
    content: string;
}


export  interface Exercise {
    exercise_id:string;
    exercise_name: string;
    exercise_summarization: string;
    file_list_summarization: string;
    exercise_files: ExerciseFile[];
    conductor_files: ExerciseFile[];
}
export class ExerciseService {
    private exercises: Exercise[] = [];

    /**
     * Add a new exercise to the list.
     * @param exercise - The exercise to be added.
     * @returns A boolean indicating success.
     */
    addExercise(exercise: Exercise): boolean {
        this.exercises.push(exercise);
        console.log(`Exercise added: ${exercise.exercise_name}`);
        return true;
    }

    /**
     * Retrieve an exercise by its unique exercise_id.
     * @param exercise_id - The unique ID of the exercise.
     * @returns The exercise with the specified ID, or null if not found.
     */
    getExercise(exercise_id: string): Exercise | null {
        const exercise = this.exercises.find(ex => ex.exercise_id === exercise_id);
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
    getExerciseList(): { exerciseName: string; exerciseSummary: string }[] {
        return this.exercises.map((exercise) => ({
            exerciseName: exercise.exercise_name,
            exerciseSummary: exercise.exercise_summarization,
        }));
    }

    /**
     * Update an existing exercise by its unique exercise_id.
     * @param exercise_id - The unique ID of the exercise to update.
     * @param updatedExercise - The new exercise data to replace the existing one.
     * @returns A boolean indicating success or failure.
     */
    updateExercise(exercise_id: string, updatedExercise: Exercise): boolean {
        const exercise = this.exercises.find(ex => ex.exercise_id === exercise_id);
        if (!exercise) {
            console.error(`Exercise with ID ${exercise_id} not found.`);
            return false;
        }

        // Update the entire exercise object
        Object.assign(exercise, updatedExercise);

        console.log(`Exercise updated: ${updatedExercise.exercise_name}`);
        return true;
    }
}
