import { AnyActorRef, assign, setup } from "xstate";

import { defaultDebounceDuration } from "../constant/constant";

type ContextInput = {
  data: unknown;
  debounceDuration?: number;
  parent: AnyActorRef;
};

const debounceMachine = setup({
  types: {} as {
    context: ContextInput & {
      syncCall: Promise<unknown>;
    };
  },
  actions: {
    updateContext: assign({
      data: (_, params) => {
        return params;
      },
    }),
  },
  delays: {
    DEBOUNCE_DURATION: ({ context }) => {
      return context.debounceDuration || defaultDebounceDuration;
    },
  },
}).createMachine({
  context: (arg) => {
    const { input } = arg as { input: ContextInput };

    return {
      data: input.data,
      debounceDuration: input.debounceDuration,
      parent: input.parent,
      syncCall: Promise.resolve(),
    };
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        UPDATE: {
          target: "waiting",
          actions: [
            {
              type: "updateContext",
              params: ({ event }) => {
                return event.payload;
              },
            },
          ],
        },
      },
    },
    waiting: {
      on: {
        UPDATE: {
          target: "waiting",
          reenter: true,
          actions: [
            {
              type: "updateContext",
              params: ({ event }) => {
                return event.payload;
              },
            },
          ],
        },
      },
      after: {
        DEBOUNCE_DURATION: {
          actions: [
            ({ context }) => {
              context.parent?.send({
                type: "DEBOUNCED_EVENT",
                payload: context.data,
              });
            },
          ],
          target: "idle",
        },
      },
    },
  },
});

export default debounceMachine;
