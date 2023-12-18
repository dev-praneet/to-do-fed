import type { NextPage } from 'next'
import Head from "next/head";
import Homepage from "../container/Homepage";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const router = useRouter();
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
