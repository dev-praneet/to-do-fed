import type { AppProps } from "next/app";

import Drawers from "../components/Drawers";
import { makeServer } from "../mirage";

import "../styles/index.scss";

if (process.env.NODE_ENV === "development") {
  makeServer({ environment: "development" });
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Drawers>
      <Component {...pageProps} />
    </Drawers>
  );
}

export default MyApp;
