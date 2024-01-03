import { useMachine } from "@xstate/react";

import MainContent from "./MainContent";
import useLog from "../../hooks/useLog";
import LeftSideBar from "../../components/LeftSideBar";
import homepageMachine from "../../machines/homepage";

import style from "./style.module.scss";

function Homepage() {
  const [{ context }, send, actorRef] = useMachine(homepageMachine, {
    // inspect: console.log,
  });
  useLog(actorRef, "homepage vala state machine");
  const { pages, activePage } = context;

  const activePageObj = pages.find((page) => page.id === activePage);

  const pageData = {
    title: activePageObj?.name,
    key: activePageObj?.id,
  };

  return (
    <div className={style.mainContainer}>
      <div className={style.container}>
        <LeftSideBar pages={pages} activePage={activePage} send={send} />
        <div className={style.taskContainer}>
          <MainContent {...pageData} send={send} />
        </div>
      </div>
    </div>
  );
}

export default Homepage;
