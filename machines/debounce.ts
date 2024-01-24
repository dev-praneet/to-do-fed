import { assign, createMachine } from "xstate";

import callAPI from "../utils/callAPI";

const debounceDuration = 500;

function delay(time: number) {
  return new Promise((res) => {
    setTimeout(res, time);
  });
}

function updateTitle({
  pageId,
  title,
}: {
  pageId: string | null;
  title: string;
}) {
  return callAPI({
    endPoint: `/page/${pageId}`,
    method: "PATCH",
    body: { title },
  });
}

export type DebounceMachineContext = {
  title: string;
  activePage: string | null;
  syncCall: Promise<unknown>;
};

export type DebounceEvent = {
  type: "UPDATE";
  title: string;
  activePage: string | null;
};

const debounceMachine = createMachine(
  {
    types: {} as {
      context: DebounceMachineContext;
      events: DebounceEvent;
      output: undefined;
    },
    context: ({
      input,
    }: {
      input: { title: string; activePage: null | string };
    }) => {
      return {
        title: input.title,
        activePage: input.activePage,
        syncCall: Promise.resolve(),
      };
    },
    initial: "waiting",
    states: {
      waiting: {
        after: {
          [debounceDuration]: {
            target: "idle",
          },
        },
        on: {
          UPDATE: {
            target: "waiting",
            reenter: true,
            actions: ["updateContext"],
          },
        },
      },
      idle: {
        on: {
          UPDATE: {
            target: "waiting",
            actions: ["updateContext"],
          },
        },
        entry: [
          assign({
            syncCall: ({ context }) => {
              const { syncCall, activePage } = context;
              return syncCall.then(() =>
                updateTitle({ pageId: activePage, title: context.title })
              );
            },
          }),
        ],
      },
    },
  },
  {
    actions: {
      updateContext: assign({
        title: ({ event }) => {
          return event.title;
        },
        activePage: ({ event }) => {
          return event.activePage;
        },
      }),
    },
  }
);

export default debounceMachine;
