import { NOTE_STATUS } from "../constant/constant";

export type ValueOf<T extends { [key: string]: string }> = T[keyof T];

export type NoteStatusTypes = ValueOf<typeof NOTE_STATUS>;
