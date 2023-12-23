import { assign, createMachine, fromCallback, fromPromise } from "xstate";

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
    initial: "initialRender",
    context: {
      activePage: null as null | string,
      pages: [] as Page[],
      queuedTitleUpdateRef: null,
    },
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
            actions: assign({
              activePage: ({ event }) => {
                const {
                  payload: { id },
                } = event;
                return id;
              },
            }),
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
        },
      },
    },
  },
  {}
);

export default menuMachine;
