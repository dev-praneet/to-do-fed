import { ActorRef, AnyActorRef, Snapshot, assign, setup } from "xstate";

export type DrawerMachineContext = {
  transitionDuration: number;
  controllingActorRef: ActorRef<Snapshot<unknown>, { type: string }> | null;
};

export type DrawerEvents =
  | { type: "OPEN_DRAWER"; payload: { actorRef: AnyActorRef } }
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
    };
  },
  id: "drawer",
  initial: "closed",
  states: {
    closed: {
      on: {
        OPEN_DRAWER: {
          actions: [
            assign({
              controllingActorRef: ({ event }) => {
                const {
                  payload: { actorRef },
                } = event;
                return actorRef;
              },
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
