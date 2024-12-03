import { inject, injectable } from "@theia/core/shared/inversify";
import { ToolProvider ,ToolRequest } from '@theia/ai-core';
import { ExerciseService } from "../../exercise-service";

@injectable()
export class GetExerciseList implements ToolProvider {
    static ID = 'GET_EXERCISE_LIST_ID';

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    getTool(): ToolRequest {
        return {
            id: GetExerciseList.ID,
            name: 'Get Exercise List',
            description: 'Retrieve a list of all exercise names and summarizations.',
            
            handler: async (): Promise<{ exerciseName: string; exerciseSummary: string }[]> => {
                const exercises = this.exerciseService.getExerciseList();
                return exercises;
            },
        };
    }
}