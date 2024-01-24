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

## Userful links

- [Runtime error on Next.js with mirage](https://github.com/miragejs/miragejs/issues/651)
