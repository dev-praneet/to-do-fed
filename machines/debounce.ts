import { assign, createMachine } from "xstate";

const debounceDuration = 1000;

function delay(time: number) {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
}

function updateTitle(title: string) {
  return delay(300);
}

const debounceMachine = createMachine(
  {
    initial: "waiting",
    context: ({ input }: { input: { title: string } }) => {
      return { title: input.title, syncCall: Promise.resolve() };
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
            actions: ["updateTitle"],
          },
        },
      },
      idle: {
        on: {
          UPDATE: {
            target: "waiting",
            actions: ["updateTitle"],
          },
        },
        entry: [
          assign({
            syncCall: ({ context, event }) => {
              const { syncCall } = context;
              return syncCall.then(() => updateTitle(context.title));
            },
          }),
        ],
      },
    },
  },
  {
    actions: {
      updateTitle: assign({
        title: ({ event }) => {
          return event.title;
        },
      }),
    },
  }
);

export default debounceMachine;
