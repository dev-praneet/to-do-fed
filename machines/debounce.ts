import { assign, createMachine } from "xstate";

import callAPI from "../utils/callAPI";

const debounceDuration = 1000;

function delay(time: number) {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
}

function updateTitle({ pageId, title }: { pageId: string; title: string }) {
  return callAPI({
    endPoint: `/page/${pageId}`,
    method: "PATCH",
    body: { title },
  });
}

const debounceMachine = createMachine(
  {
    initial: "waiting",
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
            syncCall: ({ context, event }) => {
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
