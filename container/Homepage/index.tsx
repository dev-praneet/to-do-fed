import { createContext } from "react";
import { useMachine } from "@xstate/react";
import { ActorRef, MachineSnapshot, NonReducibleUnknown } from "xstate";

import MainContent from "./MainContent";
import useLog from "../../hooks/useLog";
import LeftSideBar from "../../components/LeftSideBar";
import homepageMachine, {
  HomepageMachineEvents,
  HomepageMachineContext as THomepageMachineContext,
} from "../../machines/homepage";

import style from "./style.module.scss";

export const HomepageMachineContext = createContext(
  {} as {
    context: THomepageMachineContext;
    send: (event: HomepageMachineEvents) => void;
    // TODO -> why should the type of output be NonReducibleUnknown? Shouldn't it be undefined?
    actorRef: ActorRef<
      MachineSnapshot<
        THomepageMachineContext,
        HomepageMachineEvents,
        {},
        Required<{
          leftSideBar?: "initialRender" | "idle" | "addingPage" | undefined;
          mainContent?: "idle" | "editingTitle" | undefined;
        }>,
        string,
        NonReducibleUnknown,
        any
      >,
      HomepageMachineEvents
    >;
  }
);

function Homepage() {
  /* TODO -> why is the type for StateValue in the MachineSnapshot written in terms of 'Required' generic and
  a type of undefine also present in it */
  const [{ context }, send, actorRef] = useMachine(homepageMachine, {
    // inspect: console.log,
  });
  // useLog(actorRef, "homepage vala state machine");
  const { pages, activePage } = context;

  const activePageObj = pages.find((page) => page.id === activePage);

  const pageData = {
    title: activePageObj?.name,
    key: activePageObj?.id,
  };

  return (
    <div className={style.mainContainer}>
      <div className={style.container}>
        <HomepageMachineContext.Provider value={{ context, send, actorRef }}>
          <LeftSideBar pages={pages} activePage={activePage} send={send} />
          <div className={style.taskContainer}>
            <MainContent {...pageData} />
          </div>
        </HomepageMachineContext.Provider>
      </div>
    </div>
  );
}

export default Homepage;
