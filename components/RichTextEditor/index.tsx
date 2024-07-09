import { useEffect, useReducer, useRef } from "react";
import { EditorState, TextSelection } from "prosemirror-state";
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
  ctaFlagValue: boolean;
  showCTA: () => void;
  hideCTA: () => void;
  isSavingInProgress: boolean | undefined;
};

function RichTextEditor(props: RichTextEditorProps) {
  const {
    tempDescription,
    savedDescription,
    handleContentUpdate,
    syncTempDescription,
    handleContentSave,
    ctaFlagValue,
    showCTA,
    hideCTA,
    isSavingInProgress,
  } = props;

  const initialDescription = useRef(tempDescription || savedDescription);
  const editorRef = useRef(null);
  const withFocusRef = useRef(false);

  const [flagForRemount, remountEditor] = useReducer((state) => state + 1, 1);

  useEffect(() => {
    // Mix the nodes from prosemirror-schema-list into the basic schema to
    // create a schema with list support.
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });

    const doc = Node.fromJSON(mySchema, JSON.parse(initialDescription.current));

    const plugins = exampleSetup({
      schema: mySchema,
      //   only when we want the editor with focus, should the menu bar be present
      menuBar: withFocusRef.current,
    });

    const editorView = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc,
        plugins,
      }),
      handleDOMEvents: {
        focus: (view, event) => {
          // TODO -> see if the flags ctaFlagValue and withFocusRef.current are duplicates
          if (!ctaFlagValue) {
            showCTA();
          }

          if (!withFocusRef.current) {
            withFocusRef.current = true;
            remountEditor();
          }
        },
      },
      dispatchTransaction(transaction) {
        const newState = editorView.state.apply(transaction);
        editorView.updateState(newState);
        handleContentUpdate?.(newState);
      },
    });

    if (withFocusRef.current) {
      focusEditor(editorView);
    }

    return () => {
      editorView.destroy();
    };
  }, [handleContentUpdate, flagForRemount, ctaFlagValue, showCTA]);

  function handleCancel() {
    initialDescription.current = savedDescription;
    withFocusRef.current = false;
    remountEditor();
    syncTempDescription();
    hideCTA();
  }

  return (
    <div>
      <div id="editor" ref={editorRef}></div>
      {ctaFlagValue && (
        <button
          className={cx(style.button, style.save)}
          onClick={() => {
            withFocusRef.current = false;
            initialDescription.current = tempDescription!;
            remountEditor();
            handleContentSave();
          }}
          disabled={isSavingInProgress}
        >
          Save
        </button>
      )}
      {ctaFlagValue && (
        <button
          className={cx(style.button, style.cancel)}
          onClick={handleCancel}
          disabled={isSavingInProgress}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function focusEditor(editorView: EditorView) {
  const endPos = editorView.state.doc.content.size;
  const transaction = editorView.state.tr.setSelection(
    TextSelection.create(editorView.state.doc, endPos)
  );
  editorView.dispatch(transaction);
  editorView.focus();
}

export default RichTextEditor;
