import {
  ActorRef,
  EventObject,
  MachineSnapshot,
  PromiseSnapshot,
  StateValue,
  assertEvent,
  assign,
  fromPromise,
  raise,
  setup,
} from "xstate";

import debounceMachine, {
  DebounceEvent,
  DebounceMachineContext,
} from "./debounce";
import callAPI from "../utils/callAPI";
import { NoteStatusKeyTypes, NoteStatusObjectTypes } from "../utils/types";

function getToDo(): Promise<{ pages: { name: string }[] }> {
  return callAPI({ endPoint: "/pages" });
}

function addPage() {
  return callAPI({ endPoint: "/page/new", method: "POST" });
}

function getPageData(pageId: string) {
  return callAPI({ endPoint: `/page/${pageId}` });
}

function createNote({
  noteStatusKey,
  pageId,
}: {
  noteStatusKey: NoteStatusKeyTypes;
  pageId: string;
}) {
  return callAPI({
    endPoint: "/note/new",
    method: "POST",
    body: { noteStatusKey, pageId },
  });
}

export type Page = {
  id: string;
  name: string;
};

export type Note = {
  id: string;
  title: string;
  description: string;
  status: NoteStatusObjectTypes;
  page: string;
};

export type HomepageMachineContext = {
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
      [key: string]: ActorRef<PromiseSnapshot<unknown, unknown>, EventObject>;
    };
    newNoteByStatusKey: {
      [key in NoteStatusKeyTypes]?: ActorRef<
        PromiseSnapshot<undefined, unknown>,
        never
      >;
    };
  };
};

type TSET_NOTES_BY_PAGE_ID = {
  type: "SET_NOTES_BY_PAGE_ID";
  output: {
    notes: Note[];
    page: { id: string; name: string; notes: string[] };
  };
};

type TSET_ACTIVE_PAGE = { type: "SET_ACTIVE_PAGE"; payload: { id: string } };

export type HomepageMachineEvents =
  | TSET_NOTES_BY_PAGE_ID
  | { type: "CREATE" }
  | TSET_ACTIVE_PAGE
  | { type: "FETCH_NOTES" }
  | { type: "ADD_NOTE"; payload: { noteStatusKey: NoteStatusKeyTypes } }
  | { type: "EDIT_TITLE" }
  | { type: "UPDATE_TITLE"; payload: { title: string } }
  | {
      type: "NEW_NOTE_CREATED";
      output: { note: Note };
    }
  | {
      type: "REMOVE_ACTOR_REF";
      payload: {
        path: string[];
      };
    };

const homepageMachine = setup({
  types: {} as {
    context: HomepageMachineContext;
    events: HomepageMachineEvents;
  },
  actions: {
    setActivePage: assign({
      activePage: ({ event }) => {
        assertEvent(event, 'SET_ACTIVE_PAGE')
        const {
          payload: { id },
        } = event;
        return id;
      },
    }),
    setNotesByPageId: assign({
      notesByPageId: ({ context }, {notes, page}: TSET_NOTES_BY_PAGE_ID['output']) => {
      // notesByPageId: ({ context, event }, {notes, page}) => {
        // assertEvent(event, 'SET_NOTES_BY_PAGE_ID')
        // const {
        //   output: { notes, page },
        // } = event ;
        // } = event as TSET_NOTES_BY_PAGE_ID;
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
      newNoteByStatusKey: {},
    },
    queuedTitleUpdateRef: null,
  },
  type: "parallel",
  id: "homepage",
  on: {
    SET_NOTES_BY_PAGE_ID: {
      // actions: ["setNotesByPageId"],
      actions: [{type: "setNotesByPageId", params: ({event}) => {
return event.output;
      }}],
    },
    REMOVE_ACTOR_REF: {
      actions: [
        assign({
          spawnedActors: ({ context, event }) => {
            // TODO -> provide proper type for path
            // it is too constrained as of now
            const {
              payload: { path },
            } = event as EventObject & {
              payload: {
                path: [
                  keyof HomepageMachineContext["spawnedActors"],
                  NoteStatusKeyTypes
                ];
              };
            };
            const { spawnedActors } = context;

            switch (path.length) {
              case 2: {
                const oldObject = spawnedActors[path[0]];
                const { [path[1]]: notNeeded, ...newObject } = oldObject;
                return { ...spawnedActors, [path[0]]: newObject };
              }
              default: {
                return spawnedActors;
              }
            }
          },
        }),
      ],
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
                  notesByPageId: ({ context, event }) => {
                    const { notesByPageId } = context;
                    const {
                      output: { page },
                    } = event;
                    return { ...notesByPageId, [page.id]: page.notes };
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
        ADD_NOTE: {
          actions: [
            assign({
              spawnedActors: ({ context, event, self, spawn }) => {
                const { spawnedActors, activePage } = context;
                const { newNoteByStatusKey } = spawnedActors;
                const {
                  payload: { noteStatusKey },
                } = event;

                if (noteStatusKey in newNoteByStatusKey || !activePage) {
                  return spawnedActors;
                }

                const spawnedActor = spawn(
                  fromPromise(
                    async ({ input }: { input: { parent: typeof self } }) => {
                      const response = await createNote({
                        noteStatusKey,
                        pageId: activePage,
                      });
                      const { parent } = input;
                      parent.send({
                        type: "NEW_NOTE_CREATED",
                        output: response,
                      });
                    }
                  ),
                  {
                    input: {
                      parent: self,
                    },
                  }
                );

                spawnedActor.subscribe({
                  complete() {
                    self.send({
                      type: "REMOVE_ACTOR_REF",
                      payload: {
                        path: ["newNoteByStatusKey", noteStatusKey],
                      },
                    });
                  },
                });

                return {
                  ...spawnedActors,
                  newNoteByStatusKey: {
                    ...spawnedActors.newNoteByStatusKey,
                    [noteStatusKey]: spawnedActor,
                  },
                };
              },
            }),
          ],
        },
        NEW_NOTE_CREATED: {
          actions: [
            assign({
              notesByPageId: ({ context, event }) => {
                const { notesByPageId } = context;
                const {
                  output: { note },
                } = event;
                return {
                  ...notesByPageId,
                  [note.page]: [...notesByPageId[note.page], note],
                };
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
