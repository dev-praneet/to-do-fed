import { useRef } from "react";

import { NOTE_STATUS } from "../../../constant/constant";
import useHMContext from "../../../hooks/useHMContext";
import {
  NoteStatusKeyTypes,
  NoteStatusObjectTypes,
} from "../../../utils/types";
import { Note } from "../../../machines/homepage";
import { DRAWER_TYPE } from "../../../machines/drawer";
import { edit, ellipsis } from "../../../public/svg/images";
import { useDAContext } from "../../../components/Drawers";

import style from "./style.module.scss";

type NotesContainerProps = {
  title?: string;
};

export type EditNoteActionPayload = {
  noteStatus: NoteStatusObjectTypes;
  noteId: string;
};

function MainContent(props: NotesContainerProps) {
  const { title } = props;

  const { send, context, actorRef } = useHMContext();
  const { activePage, notesByPageId } = context;
  const notes = notesByPageId[activePage!];
  const notesByStatus = notes?.reduce(
    (acc, note) => {
      return { ...acc, [note.status.key]: [...acc[note.status.key], note] };
    },
    Object.keys(NOTE_STATUS).reduce((acc, status) => {
      return { ...acc, [status]: [] };
    }, {} as { [key in NoteStatusKeyTypes]: Note[] })
  );

  const incomingTitle = useRef(title);

  function editNote() {
    send({ type: "EDIT_TITLE" });
  }

  function onInput(event: { target: unknown }) {
    send({
      type: "UPDATE_TITLE",
      payload: {
        title: (event.target as { innerText: string }).innerText,
      },
    });
  }

  function addNote(noteStatusKey: NoteStatusKeyTypes) {
    send({
      type: "ADD_NOTE",
      payload: { noteStatusKey },
    });
  }

  const { send: sendToDAMachine } = useDAContext();

  function openDrawer({ noteStatus, noteId }: EditNoteActionPayload) {
    sendToDAMachine({
      type: "OPEN_DRAWER",
      payload: {
        actorRef,
        data: { noteStatus, noteId },
        drawerType: DRAWER_TYPE.EDIT_NOTE,
      },
    });
  }

  return (
    <div className={style.container}>
      <h1
        className={style.title}
        contentEditable={true}
        onClick={editNote}
        onInput={onInput}
      >
        {incomingTitle.current}
      </h1>
      <div className={style.noteColumnWrapper}>
        {Object.values(NOTE_STATUS).map((noteStatus) => {
          return (
            <div key={noteStatus.key} className={style.noteColumn}>
              <p>{noteStatus.label}</p>

              <div className={style.noteWrapper}>
                {notesByStatus &&
                  notesByStatus[noteStatus.key].map((note) => {
                    return (
                      <div key={note.id} className={style.note}>
                        <h3>{note.title}</h3>
                        <p className={style.noteDescription}>
                          {note.description}
                        </p>

                        <div className={style.noteOptions}>
                          <button
                            onClick={openDrawer.bind(null, {
                              noteStatus,
                              noteId: note.id,
                            })}
                          >
                            {edit}
                          </button>
                          <div>{ellipsis}</div>
                        </div>
                      </div>
                    );
                  })}
                <button
                  className={style.createNew}
                  onClick={addNote.bind(null, noteStatus.key)}
                >
                  + New
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MainContent;
