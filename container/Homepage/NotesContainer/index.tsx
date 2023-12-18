import styles from "./style.module.scss";

type PageData = {
  title: string;
};

type NotesContainerProps = {
  pageData: PageData;
};

function NotesContainer(props: NotesContainerProps) {
  const { pageData } = props;
  const { title } = pageData;

  function onChange(event) {}

  return (
    <div className={styles.container}>
      <h1 className={styles.title} contentEditable={true} onInput={onChange}>
        {title}
      </h1>
    </div>
  );
}

export default NotesContainer;
