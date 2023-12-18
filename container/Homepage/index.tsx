import cx from "classnames";
import { useMachine } from "@xstate/react";

import { plus } from "../../public/svg/images";
import menuMachine from "../../machines/homepage";

import style from "./style.module.scss";

function Homepage() {
  const [state, send] = useMachine(menuMachine);
  const { context } = state;
  const { activePage, pages } = context;

  function onPageClick(id: string) {
    return function () {};
  }

  function addPageHandler() {
    send({ type: "CREATE" });
  }

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
                  <span>{page.name}</span>
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
          {/* <NotesContainer pageData={pageData} /> */}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
