import cx from "classnames";
import { useMachine } from "@xstate/react";

import { plus } from "../../public/svg/images";
import menuMachine from "../../machines/homepage";
import NotesContainer from "./NotesContainer";

import style from "./style.module.scss";

function Homepage() {
  const [state, send, actorRef] = useMachine(menuMachine);

  const { context } = state;
  const { activePage, pages } = context;

  function onPageClick(id: string) {
    return function () {
      send({
        type: "SET_ACTIVE_PAGE",
        payload: {
          id,
        },
      });
    };
  }

  function addPageHandler() {
    send({ type: "CREATE" });
  }

const activePageObj = pages.find((page) => page.id === activePage);

  const pageData = {
    title: activePageObj?.name,
    key: activePageObj?.id,
  };

  function editNote() {
    send({ type: "EDIT_NOTE" });
  }

  function updateTitle(title: string) {
    send({
      type: "UPDATE_TITLE",
      payload: {
        title,
      },
    });
  }

  const shouldRenderNotesContainer = !!pageData.title;

  return (
    <div className={style.mainContainer}>
      <div></div>
      <div className={style.container}>
        <div className={style.sidebar}>
          {!!pages.length &&
            pages.map((page) => {
              return (
                <button
                  key={page.id}
                  className={cx(style.pageName, {
                    [style.activePage]: activePage === page.id,
                  })}
                  onClick={onPageClick(page.id)}
                >
                  <span>{page.name || "untitled"}</span>
                </button>
              );
            })}

          <button
            className={style.addAPage}
            onClick={addPageHandler}
            // disabled={mutation.isLoading}
          >
            <span className={style.plusWrapper}>{plus}</span>
            <span>Add a page</span>
          </button>
        </div>
        <div className={style.taskContainer}>
          {shouldRenderNotesContainer && (
            <NotesContainer
              key={pageData.key}
              pageData={pageData}
              editNote={editNote}
              updateTitle={updateTitle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
