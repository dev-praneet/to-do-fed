import { ReactNode, createContext, useContext, useRef } from "react";
import { ActorRef, MachineSnapshot, NonReducibleUnknown } from "xstate";
import { useMachine, useSelector } from "@xstate/react";
import cx from "classnames";

import { doubleChevronRight } from "../../public/svg/images";
import { transitionDuration } from "../../constant/constant";
import drawerMachine, {
  DRAWER_TYPE,
  DrawerEvents,
  DrawerMachineContext,
} from "../../machines/drawer";
import EditNote from "../EditNote";

import style from "./style.module.scss";

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
 * @returns { state, send, actorRef }
 */
export const useDAContext = () => {
  const context = useContext(DrawerActorContext);
  return context;
};

const Drawers = (props: { children: ReactNode }) => {
  const { children } = props;

  const [state, send, actorRef] = useMachine(drawerMachine, {
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

  const { drawerType } = state.context;

  const drawerContent =
    drawerType &&
    {
      [DRAWER_TYPE.EDIT_NOTE]: <EditNote />,
    }[drawerType];

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
          {drawerContent}
        </div>
      )}
      {children}
    </DrawerActorContext.Provider>
  );
};

export default Drawers;
