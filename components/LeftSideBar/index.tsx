import { AnyEventObject } from "xstate";
import cx from "classnames";

import { plus } from "../../public/svg/images";
import { ACTOR_ID } from "../../constant/constant";
import useLog from "../../hooks/useLog";
import { Page } from "../../machines/homepage";

import style from "./style.module.scss";

type LeftSideBarProps = {
  pages: Page[];
  activePage: null | string;
  send: (event: AnyEventObject) => void;
};

const LeftSideBar = (props: LeftSideBarProps) => {
  const { pages, activePage, send } = props;

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

  return (
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

      <button className={style.addAPage} onClick={addPageHandler}>
        <span className={style.plusWrapper}>{plus}</span>
        <span>Add a page</span>
      </button>
    </div>
  );
};

export default LeftSideBar;
