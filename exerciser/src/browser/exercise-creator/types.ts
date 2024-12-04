import {Exercise} from "../exercise-service/types";

export type ExerciseCreatorResponse = Omit<Exercise, "id">;
