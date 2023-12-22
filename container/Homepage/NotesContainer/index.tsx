import { useRef } from "react";

import styles from "./style.module.scss";

type PageData = {
  title: string | undefined;
};

type NotesContainerProps = {
  pageData: PageData;
  editNote: () => void;
  updateTitle: (title: string) => void;
};

function NotesContainer(props: NotesContainerProps) {
  const { pageData, editNote, updateTitle } = props;
  const { title } = pageData;

  const incomingTitle = useRef(title);

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
    </div>
  );
}

export default NotesContainer;
