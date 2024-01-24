import {
  ActorRef,
  EventObject,
  MachineSnapshot,
  PromiseSnapshot,
  StateValue,
  assign,
  fromPromise,
  raise,
  setup,
} from "xstate";

import callAPI from "../utils/callAPI";
import debounceMachine, {
  DebounceEvent,
  DebounceMachineContext,
} from "./debounce";
import { NoteStatusTypes } from "../utils/types";

function getToDo(): Promise<{ pages: { name: string }[] }> {
  return callAPI({ endPoint: "/pages" });
}

function addPage() {
  return callAPI({ endPoint: "/page/new", method: "POST" });
}

function getPageData(pageId: string) {
  return callAPI({ endPoint: `/page/${pageId}` });
}

export type Page = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  title: string;
  description: string;
  status: NoteStatusTypes;
};

const homepageMachine = setup({
  types: {} as {
    context: {
      activePage: null | string;
      pages: Page[];
      notesByPageId: { [key: string]: Note[] };
      //   TODO -> move it within spawnedActors
      queuedTitleUpdateRef: ActorRef<
        MachineSnapshot<
          DebounceMachineContext,
          DebounceEvent,
          {},
          StateValue,
          string,
          undefined,
          any
        >,
        DebounceEvent
      > | null;
      spawnedActors: {
        notesByPages: {
          [key: string]: ActorRef<
            PromiseSnapshot<unknown, unknown>,
            EventObject
          >;
        };
      };
    };
  },
  actions: {
    setActivePage: assign({
      activePage: ({ event }) => {
        const {
          payload: { id },
        } = event;
        return id;
      },
    }),
    setNotesByPageId: assign({
      notesByPageId: ({ context, event }) => {
        const {
          output: { notes, page },
        } = event;
        return { ...context.notesByPageId, [page.id]: notes };
      },
    }),
  },
}).createMachine({
  context: {
    activePage: null as null | string,
    pages: [] as Page[],
    notesByPageId: {},
    spawnedActors: {
      notesByPages: {},
    },
    queuedTitleUpdateRef: null,
  },
  type: "parallel",
  id: "homepage",
  on: {
    SET_NOTES_BY_PAGE_ID: {
      actions: ["setNotesByPageId"],
    },
  },
  states: {
    leftSideBar: {
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
                raise(({ event }) => {
                  return { type: "FETCH_NOTES", input: event };
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
              actions: [
                "setActivePage",
                raise(() => {
                  return { type: "FETCH_NOTES" };
                }),
              ],
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
      },
    },
    mainContent: {
      initial: "idle",
      on: {
        FETCH_NOTES: {
          actions: [
            assign({
              spawnedActors: ({ context, spawn, self }) => {
                const { activePage, spawnedActors } = context;
                const { notesByPages } = spawnedActors;

                return activePage
                  ? {
                      ...spawnedActors,
                      notesByPages: {
                        ...notesByPages,
                        [activePage]: spawn(
                          fromPromise(
                            async ({
                              input,
                            }: {
                              input: { parent: typeof self };
                            }) => {
                              const { parent } = input;
                              const pageData = await getPageData(activePage);
                              parent.send({
                                type: "SET_NOTES_BY_PAGE_ID",
                                output: pageData,
                              });
                            }
                          ),
                          { input: { parent: self } }
                        ),
                      },
                    }
                  : spawnedActors;
              },
            }),
          ],
        },
      },
      states: {
        idle: {
          on: {
            EDIT_TITLE: {
              target: "editingTitle",
            },
          },
        },
        editingTitle: {
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
  },
});

export default homepageMachine;
