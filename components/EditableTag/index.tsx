import { useRef } from "react";
import { NonReducibleUnknown } from "xstate";
import { useMachine } from "@xstate/react";

import editableTagMachine from "../../machines/editableTag";

type EditableTagProps = {
  text: string;
  syncWithBackend: (arg1: unknown, arg2: { text: string }) => void;
  onInput: (arg: string) => void;
  className: string;
};

function EditableTag(props: EditableTagProps) {
  const { text, syncWithBackend, onInput: onNewInput, className } = props;

  const incomingText = useRef(text);
  const [, send] = useMachine(
    editableTagMachine.provide({
      actions: {
        syncWithBackend: syncWithBackend as (
          arg1: unknown,
          arg2: NonReducibleUnknown
        ) => void,
      },
    })
  );

  function startEditingNote() {
    send({
      type: "START_EDITING",
    });
  }

  function onInput(event: KeyboardEvent) {
    send({
      type: "UPDATE_TEXT",
      payload: {
        text: (event.target! as unknown as { innerText: string }).innerText,
      },
    });
    onNewInput((event.target! as unknown as { innerText: string }).innerText);
  }

  return (
    <p
      contentEditable={true}
      onClick={startEditingNote}
      onInput={onInput}
      className={className}
    >
      {incomingText.current}
    </p>
  );
}

export default EditableTag;
