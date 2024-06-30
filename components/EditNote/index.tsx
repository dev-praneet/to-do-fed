import { useSelector } from "@xstate/react";

import { EditNoteActionPayload } from "../../container/Homepage/MainContent";
import { HomepageMachineContext } from "../../machines/homepage";
import { useDAContext } from "../Drawers";
import callAPI from "../../utils/callAPI";
import EditableTag from "../EditableTag";

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
    context: { activePage, notesByPageId },
  } = homepageMachineSnapshot;

  const notesOnPage = notesByPageId[activePage!];
  const note = notesOnPage.find((note) => note.id === noteId);
  const { title, description, images } = note!;

  function onTitleInput(text: string) {
    controllingActorRef?.send({
      type: "UPDATE_NOTE",
      payload: {
        activePage,
        noteId,
        title: text,
      },
    });
  }

  function onDescriptionInput(text: string) {
    controllingActorRef?.send({
      type: "UPDATE_NOTE",
      payload: {
        activePage,
        noteId,
        description: text,
      },
    });
  }

  function onImageUpload(event: { target: { files: FileList | null } }) {
    controllingActorRef?.send({
      type: "UPDATE_NOTE",
      payload: {
        activePage,
        noteId,
        images: event.target.files,
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

  function syncDescriptionWithBackend(_: unknown, params2: { text: string }) {
    callAPI({
      endPoint: `/note/${noteId}`,
      method: "PATCH",
      body: { description: params2.text },
    });
  }

  return (
    <div className={style.container}>
      <div>
        <input type="file" name="image" multiple onChange={onImageUpload} />
        <EditableTag
          text={title}
          syncWithBackend={syncTitleWithBackend}
          onInput={onTitleInput}
          className={style.title}
        />
      </div>

      <div className={style.noteContent}>
        <EditableTag
          text={description}
          syncWithBackend={syncDescriptionWithBackend}
          onInput={onDescriptionInput}
          className={style.description}
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
