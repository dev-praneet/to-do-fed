import { useEffect, useState, useRef } from "react";
import { AnyActorRef } from "xstate";

// TODO -> add the types here so that the type of Snapshot is inferred
// here and that type can be used as the type of state inside useEffect
const useCustomSelector = (
  actorRef: AnyActorRef,
  selector: (arg: unknown) => unknown
) => {
  const [selectedState, setSelectedState] = useState(() =>
    actorRef ? selector(actorRef.getSnapshot()) : undefined
  );
  const lastSelectedState = useRef(selectedState);

  useEffect(() => {
    if (!actorRef) return;

    const updateSelectedState = (state: any) => {
      const newSelectedState = selector(state);
      if (lastSelectedState.current !== newSelectedState) {
        lastSelectedState.current = newSelectedState;
        setSelectedState(newSelectedState);
      }
    };

    // Initial update
    updateSelectedState(actorRef.getSnapshot());

    const subscription = actorRef.subscribe((state) => {
      updateSelectedState(state);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [actorRef, selector]);

  return selectedState;
};

export default useCustomSelector;
