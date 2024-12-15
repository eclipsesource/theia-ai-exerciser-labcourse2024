import {inject, injectable} from '@theia/core/shared/inversify';
import {ILogger} from "@theia/core";
import {Exercise, ExerciseOverview} from "./types";
import { Emitter } from '@theia/core/lib/common/event';


@injectable()
export class ExerciseService {
    exercises: Exercise[] = [];
    protected readonly onExerciseChangeEmitter = new Emitter<Exercise[]>();
    onExerciseChange = this.onExerciseChangeEmitter.event;

    get allExercises(): Exercise[] {
        return this.exercises;
    }

    @inject(ILogger)
    protected readonly logger: ILogger;

    /**
     * Add a new exercise to the list.
     * @param exercise - The exercise to be added.
     * @returns A boolean indicating success.
     */
    addExercise(exercise: Exercise): boolean {
        this.exercises.push(exercise);
        this.onExerciseChangeEmitter.fire(this.exercises);
        this.logger.info(`Exercise added: ${exercise.exerciseName}`);
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
            this.logger.error(`Exercise with ID ${exercise_id} not found.`);
            return null;
        }
        return exercise;
    }

    /**
     * Retrieve a list of all exercise names and summaries.
     * @returns A list of objects containing the name and summary of each exercise.
     */
    getExerciseList(): ExerciseOverview[] {
        return this.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            exerciseSummarization: exercise.exerciseSummarization,
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
            this.logger.error(`Exercise with ID ${exercise_id} not found.`);
            return false;
        }

        // Update the entire exercise object
        Object.assign(exercise, updatedExercise);

        this.logger.info(`Exercise updated: ${updatedExercise.exerciseName}`);
        return true;
    }

    removeExercise(exercise_id: string): boolean {
        const index = this.exercises.findIndex(ex => ex.exerciseId === exercise_id);
        if (index === -1) {
            return false;
        }
        this.exercises.splice(index, 1)
        return true;
    }
}


