import { ActorRef, Snapshot, assign, createMachine, fromPromise } from "xstate";

import callAPI from "../utils/callAPI";
import debounceMachine from "./debounce";

export function getToDo(): Promise<{ pages: { name: string }[] }> {
  return callAPI({ endPoint: "/pages" });
}

export function addPage() {
  return callAPI({ endPoint: "/page/new", method: "POST" });
}

// TODO - will be used later
// function getPageData({
//   queryKey,
// }: {
//   queryKey: [unknown, { activePage: string }];
// }) {
//   const [, { activePage }] = queryKey;
//   return callAPI({ endPoint: `/page/${activePage}` });
// }

type Page = {
  id: string;
  name: string;
};

const menuMachine = createMachine(
  {
    types: {} as {
      context: {
        activePage: null | string;
        pages: Page[];
        queuedTitleUpdateRef: ActorRef<
          Snapshot<undefined>,
          { type: string; title: string; activePage: string | null }
        > | null;
      };
    },
    context: {
      activePage: null as null | string,
      pages: [] as Page[],
      queuedTitleUpdateRef: null,
    },
    initial: "initialRender",
    states: {
      initialRender: {
        invoke: {
          src: fromPromise(getToDo),
          onDone: {
            actions: [
              assign({
                pages: ({ event }) => {
                  const {
                    output: { pages },
                  } = event;
                  return pages;
                },
                activePage: ({ event }) => {
                  const {
                    output: { pages },
                  } = event;
                  return pages.length ? "1" : null;
                },
              }),
            ],
            target: "idle",
          },
        },
      },
      idle: {
        on: {
          CREATE: {
            target: "addingPage",
          },
          SET_ACTIVE_PAGE: {
            actions: ["setActivePage"],
          },
          EDIT_NOTE: {
            target: "editingNote",
          },
        },
      },
      addingPage: {
        invoke: {
          src: fromPromise(addPage),
          onDone: {
            actions: [
              assign({
                pages: ({ context, event }) => {
                  const {
                    output: { page },
                  } = event;
                  const { pages } = context;
                  return [...pages, page];
                },
                activePage: ({ event }) => {
                  const {
                    output: { page },
                  } = event;
                  return page.id;
                },
              }),
            ],
            target: "idle",
          },
        },
      },
      editingNote: {
        on: {
          UPDATE_TITLE: {
            actions: [
              ({ event, context }) => {
                const { activePage, queuedTitleUpdateRef } = context;
                if (queuedTitleUpdateRef) {
                  queuedTitleUpdateRef.send({
                    type: "UPDATE",
                    title: event.payload.title,
                    activePage,
                  });
                }
              },
              assign({
                pages: ({ context, event }) => {
                  const { pages, activePage } = context;
                  const {
                    payload: { title },
                  } = event;

                  const updatedPages = pages.map((page) => {
                    if (page.id === activePage) {
                      return { ...page, name: title };
                    }
                    return page;
                  });

                  return updatedPages;
                },
                queuedTitleUpdateRef: ({ context, event, spawn }) => {
                  const { activePage, queuedTitleUpdateRef } = context;
                  return (
                    queuedTitleUpdateRef ||
                    spawn(debounceMachine, {
                      input: { ...event.payload, activePage },
                    })
                  );
                },
              }),
            ],
          },
          SET_ACTIVE_PAGE: {
            actions: ["setActivePage"],
            target: "idle",
          },
          CREATE: {
            target: "addingPage",
          },
        },
      },
    },
  },
  {
    actions: {
      setActivePage: assign({
        activePage: ({ event }) => {
          const {
            payload: { id },
          } = event;
          return id;
        },
      }),
    },
  }
);

export default menuMachine;
