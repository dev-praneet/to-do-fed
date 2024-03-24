import { ActorRef, AnyActorRef, Snapshot, assign, setup } from "xstate";

export const DRAWER_TYPE = {
  EDIT_NOTE: "EDIT_NOTE",
} as const;

type DrawerType = keyof typeof DRAWER_TYPE;

export type DrawerMachineContext = {
  transitionDuration: number;
  controllingActorRef: AnyActorRef | null;
  drawerType: DrawerType | null;
  data: unknown;
};

export type DrawerEvents =
  | {
      type: "OPEN_DRAWER";
      payload: { actorRef: AnyActorRef; data: unknown; drawerType: DrawerType };
    }
  | { type: "CLOSE_DRAWER" };

const drawerMachine = setup({
  types: {} as {
    context: DrawerMachineContext;
    input: { transitionDuration: number };
    events: DrawerEvents;
  },
  delays: {
    TRANSITION_DURATION: ({ context }) => {
      return context.transitionDuration;
    },
  },
}).createMachine({
  context: ({ input }) => {
    return {
      transitionDuration: input.transitionDuration,
      controllingActorRef: null,
      drawerType: null,
      data: null,
    };
  },
  id: "drawer",
  initial: "closed",
  states: {
    closed: {
      on: {
        OPEN_DRAWER: {
          actions: [
            assign((args) => {
              const { event } = args;
              const { payload } = event;
              const { actorRef, data, drawerType } = payload;
              return {
                controllingActorRef: actorRef,
                data,
                drawerType,
              };
            }),
          ],
          target: "open",
        },
      },
    },
    open: {
      on: {
        CLOSE_DRAWER: {
          target: "closing",
        },
      },
    },
    closing: {
      after: {
        TRANSITION_DURATION: {
          target: "closed",
        },
      },
      exit: assign({
        controllingActorRef: null,
      }),
    },
  },
});

export default drawerMachine;
