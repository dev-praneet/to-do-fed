import { useContext } from "react";

import { HomepageMachineContext } from "../container/Homepage";

/**
 * HM stands for Homepage Machine
 */
const useHMContext = () => {
  const { context, send } = useContext(HomepageMachineContext);

  return { context, send };
};

export default useHMContext;
