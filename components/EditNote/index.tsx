import { useCallback } from "react";
import { useSelector } from "@xstate/react";
import { EditorState } from "prosemirror-state";

import { EditNoteActionPayload } from "../../container/Homepage/MainContent";
import { HomepageMachineContext } from "../../machines/homepage";
import { useDAContext } from "../Drawers";
import callAPI from "../../utils/callAPI";
import EditableTag from "../EditableTag";
import RichTextEditor from "../RichTextEditor";

import style from "./style.module.scss";

function EditNote() {
  const {
    state: { context },
  } = useDAContext();

  const { controllingActorRef, data } = context;
  const { noteId } = data as EditNoteActionPayload;

  const homepageMachineSnapshot: { context: HomepageMachineContext } =
    useSelector(controllingActorRef!, (state) => {
      return state;
    });

  const {
    context: { activePage, notesByPageId, tempNoteDescription: tempDescObj },
  } = homepageMachineSnapshot;
  const key = JSON.stringify([activePage, noteId]);
  const tempDescription = tempDescObj[key];

  const notesOnPage = notesByPageId[activePage!];
  const note = notesOnPage.find((note) => note.id === noteId);
  const { title, description, images } = note!;

  function onTitleInput(text: string) {
    controllingActorRef?.send({
      type: "UPDATE_NOTE",
      payload: {
        activePage,
        noteId,
        dataToUpdate: {
          title: text,
        },
      },
    });
  }

  function onImageUpload(event: { target: { files: FileList | null } }) {
    controllingActorRef?.send({
      type: "UPDATE_NOTE",
      payload: {
        activePage,
        noteId,
        dataToUpdate: { images: event.target.files },
      },
    });
  }

  function syncTitleWithBackend(_: unknown, params2: { text: string }) {
    callAPI({
      endPoint: `/note/${noteId}`,
      method: "PATCH",
      body: { title: params2.text },
    });
  }

  const handleDescriptionUpdate = useCallback(
    function (editorState: EditorState) {
      const { doc } = editorState.toJSON();

      controllingActorRef?.send({
        type: "UPDATE_NOTE_DESCRIPTION",
        payload: {
          noteId,
          dataToUpdate: {
            description: JSON.stringify(doc),
          },
        },
      });
    },
    [noteId, controllingActorRef]
  );

  function handleDescriptionSave() {
    controllingActorRef?.send({
      type: "SAVE_NOTE_DESCRIPTION",
      payload: {
        activePage,
        noteId,
      },
    });
  }

  const syncTempDescription = useCallback(
    function () {
      controllingActorRef?.send({
        type: "SYNC_TEMP_DESCRIPTION",
        payload: {
          noteId,
        },
      });
    },
    [noteId, controllingActorRef]
  );

  return (
    <div className={style.container}>
      <div>
        <EditableTag
          text={title}
          syncWithBackend={syncTitleWithBackend}
          onInput={onTitleInput}
          className={style.title}
        />
      </div>

      <div className={style.noteContent}>
        <RichTextEditor
          handleContentUpdate={handleDescriptionUpdate}
          handleContentSave={handleDescriptionSave}
          syncTempDescription={syncTempDescription}
          tempDescription={tempDescription}
          savedDescription={description}
        />

        <input
          type="file"
          name="image"
          multiple
          onChange={onImageUpload}
          className={style.imageInput}
        />
        <div>
          {images?.map((image) => {
            return (
              <div
                key={image.objectURL}
                className={style.imageWrapper}
                style={{ opacity: image.isUploadedOnDB ? 1 : 0.5 }}
              >
                <img src={image.isUploadedOnDB ? image.src : image.objectURL} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EditNote;
