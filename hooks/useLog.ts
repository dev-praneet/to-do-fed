import { useEffect } from "react";
import { ActorRef, EventObject, Snapshot } from "xstate";

export default function useLog(
  actorRef: ActorRef<Snapshot<unknown>, EventObject>
) {
  useEffect(() => {
    console.log("useEffect ran");
    const subscription = actorRef.subscribe({
      next(snapshot) {
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
  }, [actorRef]);
}
