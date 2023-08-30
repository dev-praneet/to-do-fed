import type { NextPage } from 'next'
import Head from "next/head";
import Homepage from "../container/Homepage";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>To Do App</title>
        <meta name="To Do App" content="A to do app" />
      </Head>

      <Homepage />
    </div>
  );
};

export default Home
