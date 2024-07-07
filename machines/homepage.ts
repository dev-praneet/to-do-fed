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
import apiCallMachine, { APIMachineContext, APIMachineEvent } from "./apiCall";

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

type NoteImageObj = {
  isUploadedOnDB: boolean;
  objectURL: string;
  src?: string;
};

export type Note = {
  id: string;
  title: string;
  description: string;
  status: NoteStatusObjectTypes;
  page: string;
  images?: NoteImageObj[];
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
    /* this keys within this object will be JSON stringified version of 
    the array [pageId, noteId, title/description/images] */
    updatingNotes: {
      // TODO update type to remove the type errors
      [key: string]: ActorRef<
        MachineSnapshot<
          APIMachineContext,
          APIMachineEvent,
          {},
          StateValue,
          string,
          undefined,
          any
        >,
        APIMachineEvent
      >;
    };
  };
  tempNoteDescription: {
    [key: string]: string;
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
    }
  | {
      type: "UPDATE_NOTE_DESCRIPTION";
      payload: {
        noteId: string;
        dataToUpdate: {
          description: string;
        };
      };
    }
  | {
      type: "SAVE_NOTE_DESCRIPTION";
      payload: {
        activePage: string;
        noteId: string;
      };
    }
  | {
      type: "SYNC_TEMP_DESCRIPTION";
      payload: {
        noteId: string;
      };
    }
  | {
      type: "NOTE_UPDATED_SUCCESSFULLY";
      payload: {
        relData: {
          type: "description" | "images";
          activePage: string;
          noteId: string;
        };
        output: { note: Note };
      };
    }
  | {
      type: "UPDATE_NOTE";
      payload: {
        activePage: string;
        noteId: string;
        dataToUpdate:
          | {
              title: string;
            }
          | { images: FileList | null };
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
        assertEvent(event, "SET_ACTIVE_PAGE");
        const {
          payload: { id },
        } = event;
        return id;
      },
    }),
    setNotesByPageId: assign({
      notesByPageId: (
        { context },
        { notes, page }: TSET_NOTES_BY_PAGE_ID["output"]
      ) => {
        return { ...context.notesByPageId, [page.id]: notes };
      },
    }),
    saveNoteDescription: assign(({ context, event, spawn, self }) => {
      const { notesByPageId, spawnedActors, tempNoteDescription } = context;
      assertEvent(event, "SAVE_NOTE_DESCRIPTION");
      const {
        payload: { activePage, noteId },
      } = event;
      const { [JSON.stringify([activePage, noteId])]: description } =
        tempNoteDescription;

      if (!description) {
        return {};
      }

      const spdActor = spawn(apiCallMachine, {
        input: {
          apiCallData: {
            endPoint: `/note/${noteId}`,
            method: "PATCH",
            body: { description },
          },
          parent: self,
          eventToSend: "NOTE_UPDATED_SUCCESSFULLY",
          relData: {
            activePage,
            noteId,
            type: "description",
          },
        },
      });

      const key = JSON.stringify([activePage, noteId, "description"]);

      spdActor.subscribe({
        complete() {
          self.send({
            type: "REMOVE_ACTOR_REF",
            payload: {
              path: ["updatingNotes", key],
            },
          });
        },
      });

      return {
        notesByPageId: {
          ...notesByPageId,
          [activePage]: notesByPageId[activePage].map((note) => {
            if (note.id === noteId) {
              return {
                ...note,
                description,
              };
            }

            return note;
          }),
        },
        spawnedActors: {
          ...spawnedActors,
          updatingNotes: {
            ...spawnedActors.updatingNotes,
            key: spdActor,
          },
        },
      };
    }),
    syncTempDescription: assign({
      tempNoteDescription: ({ context, event }) => {
        assertEvent(event, "SYNC_TEMP_DESCRIPTION");
        const { payload } = event;
        const { noteId } = payload;
        const { tempNoteDescription, activePage, notesByPageId } = context;

        if (!activePage) {
          return tempNoteDescription;
        }

        const { description } =
          notesByPageId[activePage].find((note) => note.id === noteId) || {};

        if (!description) {
          return tempNoteDescription;
        }

        const key = JSON.stringify([activePage, noteId]);

        return { ...tempNoteDescription, [key]: description };
      },
    }),
    updateNoteSuccessfully: assign({
      notesByPageId: ({ context, event }) => {
        const { notesByPageId } = context;
        assertEvent(event, "NOTE_UPDATED_SUCCESSFULLY");
        const {
          payload: { output, relData },
        } = event;
        const { activePage, noteId, type } = relData;
        const { note: updatedNote } = output;

        return {
          ...notesByPageId,
          [activePage]: notesByPageId[activePage].map((note) => {
            if (note.id === noteId) {
              if (type === "images") {
                return {
                  ...note,
                  images: note.images?.map((image, index) => {
                    return {
                      ...image,
                      isUploadedOnDB: true,
                      src: updatedNote.images[index].src,
                    };
                  }),
                };
              }

              if (type === "description") {
                return {
                  ...note,
                  description: updatedNote.description,
                };
              }

              return note;
            }

            return note;
          }),
        };
      },
    }),
    updateNote: assign({
      notesByPageId: ({ context, event }) => {
        const { notesByPageId } = context;
        assertEvent(event, "UPDATE_NOTE");
        const {
          payload: { activePage, noteId, dataToUpdate },
        } = event;

        return {
          ...notesByPageId,
          [activePage]: notesByPageId[activePage].map((note) => {
            if (note.id === noteId) {
              if ("images" in dataToUpdate && dataToUpdate.images) {
                const images = [...dataToUpdate.images];

                return {
                  ...note,
                  ...dataToUpdate,
                  images: images.map((image) => {
                    const imageBlob = new Blob([image]);
                    return {
                      objectURL: URL.createObjectURL(imageBlob),
                      isUploadedOnDB: false,
                    };
                  }),
                };
              }
              return { ...note, ...(dataToUpdate as { title: string }) };
            }
            return note;
          }),
        };
      },
      spawnedActors: ({ context, event, self, spawn }) => {
        const { spawnedActors } = context;
        assertEvent(event, "UPDATE_NOTE");
        const {
          payload: { activePage, noteId, dataToUpdate, ...rest },
        } = event;

        // TODO -> this is as of now a temporary way to handle the case just
        // for image update. Need to add the case for title too.
        if ("images" in dataToUpdate && dataToUpdate.images) {
          const fd = new FormData();
          for (let i = 0; i < dataToUpdate.images.length; i++) {
            fd.append(`images`, dataToUpdate.images[i]);
          }

          //   TODO -> see if I can use spawnChild here in place of spawn
          // that way I wouldn't be saving a reference and no need to remove that reference later
          const spdActor = spawn(apiCallMachine, {
            input: {
              apiCallData: {
                endPoint: `/note/${noteId}`,
                method: "PATCH",
                body: fd,
              },
              parent: self,
              eventToSend: "NOTE_UPDATED_SUCCESSFULLY",
              relData: {
                activePage,
                noteId,
                type: "images",
              },
            },
          });

          const key = JSON.stringify([activePage, noteId, "images"]);

          spdActor.subscribe({
            complete() {
              self.send({
                type: "REMOVE_ACTOR_REF",
                payload: {
                  path: ["updatingNotes", key],
                },
              });
            },
          });

          return {
            ...spawnedActors,
            updatingNotes: {
              ...spawnedActors.updatingNotes,
              key: spdActor,
            },
          };
        }

        return spawnedActors;
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
      updatingNotes: {},
    },
    queuedTitleUpdateRef: null,
    tempNoteDescription: {} as { [key: string]: string },
  },
  type: "parallel",
  id: "homepage",
  on: {
    SET_NOTES_BY_PAGE_ID: {
      actions: [
        {
          type: "setNotesByPageId",
          params: ({ event }) => {
            const { output } = event;
            return {
              ...output,
              notes: output.notes.map((note) => {
                if ("images" in note) {
                  note.images = note.images?.map((image) => {
                    return { ...image, isUploadedOnDB: true };
                  });
                }
                return note;
              }),
            };
          },
        },
      ],
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
      type: "parallel",
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
        UPDATE_NOTE: {
          actions: ["updateNote"],
        },
        UPDATE_NOTE_DESCRIPTION: {
          actions: [
            assign({
              tempNoteDescription: ({ context, event }) => {
                const { tempNoteDescription, activePage } = context;
                const { noteId, dataToUpdate } = event.payload;
                const key = JSON.stringify([activePage, noteId]);

                return {
                  ...tempNoteDescription,
                  [key]: dataToUpdate.description,
                };
              },
            }),
          ],
        },
        SAVE_NOTE_DESCRIPTION: {
          actions: ["saveNoteDescription"],
        },
        SYNC_TEMP_DESCRIPTION: {
          actions: ["syncTempDescription"],
        },
        NOTE_UPDATED_SUCCESSFULLY: {
          actions: ["updateNoteSuccessfully"],
        },
      },
      states: {
        title: {
          initial: "idle",
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
        notes: {},
      },
    },
  },
});

export default homepageMachine;
