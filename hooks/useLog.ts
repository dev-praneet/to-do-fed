import { useEffect } from "react";
import { ActorRef, EventObject, Snapshot } from "xstate";

export default function useLog(
  actorRef: ActorRef<Snapshot<unknown>, EventObject>,
  logString?: string
) {
  useEffect(() => {
    const subscription = actorRef.subscribe({
      next(snapshot) {
        logString && console.log(logString);
        console.log("snapshot is: ", snapshot);
      },
      error(err) {
        // ...
      },
      complete() {
        // ...
      },
    });

    return subscription.unsubscribe;
  }, [actorRef, logString]);
}
