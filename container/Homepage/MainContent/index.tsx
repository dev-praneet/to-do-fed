import { useEffect, useRef } from "react";
import { AnyEventObject } from "xstate";

import useLog from "../../../hooks/useLog";
import { ACTOR_ID } from "../../../constant/constant";

import styles from "./style.module.scss";

type NotesContainerProps = {
  send: (event: AnyEventObject) => void;
  title?: string;
};

function MainContent(props: NotesContainerProps) {
  const { send, title } = props;

  const incomingTitle = useRef(title);

  function editNote() {
    send({ type: "EDIT_TITLE" });
  }

  function updateTitle(title: string) {
    send({
      type: "UPDATE_TITLE",
      payload: {
        title,
      },
    });
  }

  function onInput(event: { target: unknown }) {
    updateTitle((event.target as { innerText: string }).innerText);
  }

  return (
    <div className={styles.container}>
      <h1
        className={styles.title}
        contentEditable={true}
        onClick={editNote}
        onInput={onInput}
      >
        {incomingTitle.current}
      </h1>
      <p>This is the main component</p>
    </div>
  );
}

export default MainContent;
