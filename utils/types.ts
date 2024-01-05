import { NOTE_STATUS } from "../constant/constant";

export type ValueOf<T extends {}> = T[keyof T];

export type NoteStatusTypes = ValueOf<typeof NOTE_STATUS>["key"];
