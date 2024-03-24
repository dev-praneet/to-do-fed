This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Things that has been implemented

- There is a sidebar and a main content page
- Initial API call fetches the data for the pages to show in the sidebar
- Based on the first response from the list of pages, all the notes in that page is fetched
- A button is provided in the left sidebar to add a new page
- Feature is provided to update the title for the page for which the API call is done in the background
- While updating the title, debounce has been implemented to limit the number of API calls
- The active page can be changed on clicking that particular page which fetches the notes for that page
- Fetching of the notes is done in the background for situation where the user might switch quickly from one page to the next
- A new note can be created within any page
- On hovering a note an options menu appears which contains an edit button and an ellipsis. On clicking the edit button, a drawer appears from the right and slides away when the drawer is closed.
- The note title and description can be edited from within the drawer and this update reflects everywhere. Also for API calls to update the note in DB, debounce is implemented.

## Points to note

- Consider two atomic states `addingNote` and `editingTitle` in a compound state `mainContent`. Is it advisable to have an `addingNote` state just to initiate some API call? `editingTitle` state seems fine in comparison because if we are in this state there is something we can do which is edit the title. And since the parent compound state `mainContent` is not a parallel state, it is not reasonable to be in `editingTitle` state as well as `addingNote` state which could possibly be the case sometimes
- I gave up on the idea of having separate machines for say `leftSidebar` and `mainContent` because I could not figure out how to access the context of the child state machine (`leftSidebar`/`mainContent`) in React components. The only way to access that for me was to send some event which would contain the data from the context of that child state machine. But probably I was wrong. I could use the actorRef and `useSelector` hook in the component to get the context.


## Things to know

- Does all the state machines being used in a React component stop and cleared from memory when that component unmounts?
- Is there a way to initialize a state machine where the initial state is set based on the input that is provided?

## Userful links

- [Runtime error on Next.js with mirage](https://github.com/miragejs/miragejs/issues/651)
