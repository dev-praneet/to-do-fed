import type { NextPage } from 'next'
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>To Do App</title>
        <meta name="To Do App" content="A to do app" />
      </Head>

      <main>
        <span>Hello there!</span>
      </main>
    </div>
  );
};

export default Home
