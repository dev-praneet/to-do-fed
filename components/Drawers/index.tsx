import { ReactNode, createContext, useContext } from "react";
import { useMachine } from "@xstate/react";
import cx from "classnames";

import { doubleChevronRight } from "../../public/svg/images";
import { transitionDuration } from "../../constant/constant";
import drawerMachine, {
  DrawerEvents,
  DrawerMachineContext,
} from "../../machines/drawer";

import style from "./style.module.scss";
import {
  ActorRef,
  AnyEventObject,
  MachineSnapshot,
  NonReducibleUnknown,
} from "xstate";

type StateSnapshot = MachineSnapshot<
  DrawerMachineContext,
  DrawerEvents,
  {},
  "closed" | "open" | "closing",
  string,
  NonReducibleUnknown,
  any
>;

const DrawerActorContext = createContext(
  {} as {
    state: StateSnapshot;
    send: (event: DrawerEvents) => void;
    actorRef: ActorRef<StateSnapshot, DrawerEvents>;
  }
);

/**
 * DA stands for DrawerActor
 * @returns
 */
export const useDAContext = () => {
  const context = useContext(DrawerActorContext);
  return context;
};

const Drawers = (props: { children: ReactNode }) => {
  const { children } = props;

  const [state, send, actorRef] = useMachine(drawerMachine, {
    inspect: console.log,
    input: {
      transitionDuration,
    },
  });

  const showDrawer = state.matches("open") || state.matches("closing");

  function closeDrawer() {
    send({
      type: "CLOSE_DRAWER",
    });
  }

  console.log("context data in drawer is: ", state.context);

  return (
    <DrawerActorContext.Provider value={{ state, send, actorRef }}>
      {showDrawer && (
        <div
          className={cx(style.container, {
            [style.slideIn]: state.matches("open"),
            [style.slideOut]: state.matches("closing"),
          })}
          style={
            {
              "--transition-duration": `${transitionDuration}ms`,
            } as React.CSSProperties
          }
        >
          <div className={style.topBar}>
            <button className={style.closeButton} onClick={closeDrawer}>
              {doubleChevronRight}
            </button>
          </div>
        </div>
      )}
      {children}
    </DrawerActorContext.Provider>
  );
};

export default Drawers;
