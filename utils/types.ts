import { NOTE_STATUS } from "../constant/constant";

export type ValueOf<T extends {}> = T[keyof T];

export type NoteStatusObjectTypes = ValueOf<typeof NOTE_STATUS>;
export type NoteStatusKeyTypes = ValueOf<typeof NOTE_STATUS>["key"];
