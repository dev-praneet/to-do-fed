import { AnyActorRef, assign, setup } from "xstate";

import debounceMachine from "./debounce2";

type EditableTagMachineEvents =
  | {
      type: "START_EDITING";
    }
  | {
      type: "DEBOUNCED_EVENT";
      payload: unknown;
    }
  | {
      type: "UPDATE_TEXT";
      payload: unknown;
    };

const editableTagMachine = setup({
  types: {} as {
    context: {
      queuedTextUpdateRef: AnyActorRef | null;
    };
    events: EditableTagMachineEvents;
  },
}).createMachine({
  context: () => {
    return {
      queuedTextUpdateRef: null,
    };
  },
  initial: "idle",
  on: {
    DEBOUNCED_EVENT: {
      actions: [
        {
          type: "syncWithBackend",
          params: ({ event }) => {
            return event.payload;
          },
        },
      ],
    },
  },
  states: {
    idle: {
      on: {
        START_EDITING: {
          target: "editingText",
        },
      },
    },
    editingText: {
      entry: [
        assign({
          queuedTextUpdateRef: ({ context, spawn, self }) => {
            const { queuedTextUpdateRef } = context;
            return (
              queuedTextUpdateRef ||
              spawn(debounceMachine, {
                input: {
                  parent: self,
                },
              })
            );
          },
        }),
      ],
      on: {
        UPDATE_TEXT: {
          actions: [
            ({ context, event }) => {
              const { queuedTextUpdateRef } = context;
              queuedTextUpdateRef?.send({
                type: "UPDATE",
                payload: event.payload,
              });
            },
          ],
        },
      },
    },
  },
});

export default editableTagMachine;
