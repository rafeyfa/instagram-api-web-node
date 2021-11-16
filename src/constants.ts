import { homedir } from "os";

export const HOME_PATH = homedir();
export const PROJECT_ROOT_PATH = __dirname + '/../';
export const VERSION = "v5.0.6";
export const ONE_LINE_CHANGELOG = "Fix unfeedback checkpoint.";
export const IS_DEV = process.env.NODE_ENV && process.env.NODE_ENV === "development";
