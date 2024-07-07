import { AnyActorRef, EventObject, fromPromise, setup } from "xstate";

import callAPI, { CallApiArguments } from "../utils/callAPI";

type APIMachineInput = {
  apiCallData: CallApiArguments;
  parent: AnyActorRef;
  eventToSend: string;
  relData: unknown;
};

export type APIMachineContext = APIMachineInput;

export type APIMachineEvent = EventObject;

const apiCallMachine = setup({
  types: {} as {
    input: APIMachineInput;
    context: APIMachineContext;
  },
  actions: {},
  actors: {
    fetch: fromPromise(({ input }: { input: CallApiArguments }) => {
      return callAPI(input);
    }),
  },
}).createMachine({
  context: ({ input }) => {
    const { apiCallData, parent, eventToSend, relData } = input;

    return {
      apiCallData,
      parent,
      eventToSend,
      relData,
    };
  },
  initial: "fetching",
  states: {
    fetching: {
      invoke: {
        src: "fetch",
        input: ({ context }) => {
          const { apiCallData } = context;
          return apiCallData;
        },
        onDone: {
          target: "success",
          actions: [
            ({ event }) => {
              const { output } = event;
              return output;
            },
          ],
        },
      },
    },
    failed: {},
    success: {
      type: "final",
      entry: [
        ({ context, event }) => {
          const { parent, eventToSend, relData } = context;
          const { output } = event;
          parent.send({
            type: eventToSend,
            payload: { output, relData },
          });
        },
      ],
    },
  },
});

export default apiCallMachine;
