import { useContext } from "react";

import { HomepageMachineContext } from "../container/Homepage";

/**
 * HM stands for Homepage Machine
 */
const useHMContext = () => {
  const { context, send, actorRef } = useContext(HomepageMachineContext);

  return { context, send, actorRef };
};

export default useHMContext;
