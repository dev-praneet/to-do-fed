import { assign, createMachine, fromCallback, fromPromise } from "xstate";
import callAPI from "../utils/callAPI";

export function getToDo(): Promise<{ pages: { name: string }[] }> {
  console.log("getToDo called");
  return callAPI({ endPoint: "/pages" });
}

export function addPage() {
  console.log("add page called");
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
      pageAdded: {},
    },
  },
  {}
);

export default menuMachine;
