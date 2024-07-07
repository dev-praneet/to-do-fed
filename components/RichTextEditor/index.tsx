import { useEffect, useReducer, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, Node } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import cx from "classnames";

import style from "./style.module.scss";

type RichTextEditorProps = {
  tempDescription: string | null | undefined;
  savedDescription: string;
  handleContentUpdate: (params: EditorState) => void;
  syncTempDescription: () => void;
  handleContentSave: () => void;
};

function RichTextEditor(props: RichTextEditorProps) {
  const {
    tempDescription,
    savedDescription,
    handleContentUpdate,
    syncTempDescription,
    handleContentSave,
  } = props;

  const initialDescription = useRef(tempDescription || savedDescription);
  const editorRef = useRef(null);

  const [flagForRemount, remountEditor] = useReducer((state) => state + 1, 1);

  const areButtonsEnabled =
    !!tempDescription && tempDescription !== savedDescription;

  useEffect(() => {
    // Mix the nodes from prosemirror-schema-list into the basic schema to
    // create a schema with list support.
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });

    const doc = Node.fromJSON(mySchema, JSON.parse(initialDescription.current));

    const editorView = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc,
        plugins: exampleSetup({ schema: mySchema }),
      }),
      dispatchTransaction(transaction) {
        const newState = editorView.state.apply(transaction);
        editorView.updateState(newState);
        handleContentUpdate?.(newState);
      },
    });

    return () => {
      editorView.destroy();
    };
  }, [handleContentUpdate, syncTempDescription, flagForRemount]);

  function handleCancel() {
    initialDescription.current = savedDescription;
    remountEditor();
    syncTempDescription();
  }

  return (
    <div>
      <div id="editor" ref={editorRef}></div>
      <button
        className={cx(style.button, style.save)}
        onClick={handleContentSave}
        disabled={!areButtonsEnabled}
      >
        Save
      </button>
      <button
        className={cx(style.button, style.cancel)}
        onClick={handleCancel}
        disabled={!areButtonsEnabled}
      >
        Cancel
      </button>
    </div>
  );
}

export default RichTextEditor;
