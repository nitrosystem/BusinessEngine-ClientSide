/* @flow */

import * as monaco from "monaco-editor/esm/vs/editor/editor.main";

/**
 * Monkeypatch to make 'Find All References' work across multiple files
 * https://github.com/Microsoft/monaco-editor/issues/779#issuecomment-374258435
 */
global.MonacoEnvironment = {
  getWorker(moduleId, label) {
    let MonacoWorker;

    switch (label) {
      case "json":
        /* $FlowFixMe */
        MonacoWorker = require("worker-loader!monaco-editor/esm/vs/language/json/json.worker");
        break;
      case "typescript":
      case "javascript":
        /* $FlowFixMe */
        MonacoWorker = require("worker-loader!monaco-editor/esm/vs/language/typescript/ts.worker");
        break;
      default:
        /* $FlowFixMe */
        MonacoWorker = require("worker-loader!monaco-editor/esm/vs/editor/editor.worker");
    }

    return new MonacoWorker();
  },
};

/**
 * Disable typescript's diagnostics for JavaScript files.
 * This suppresses errors when using Flow syntax.
 * It's also unnecessary since we use ESLint for error checking.
 */
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

/**
 * Use prettier to format JavaScript code.
 * This will replace the default formatter.
 */
monaco.languages.registerDocumentFormattingEditProvider("javascript", {
  async provideDocumentFormattingEdits(model) {
    const prettier = await import("prettier/standalone");
    const babylon = await import("prettier/parser-babel");
    const text = prettier.format(model.getValue(), {
      parser: "babylon",
      plugins: [babylon],
      singleQuote: true,
    });

    return [
      {
        range: model.getFullModelRange(),
        text,
      },
    ];
  },
});

/**
 * Sync all the models to the worker eagerly.
 * This enables intelliSense for all files without needing an `addExtraLib` call.
 */
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

/**
 * Configure the typescript compiler to detect JSX and load type definitions
 */
const compilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  alwaysStrict: true,
};

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
  compilerOptions
);
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
  compilerOptions
);

// Store editor states such as cursor position, selection and scroll position for each model
const editorStates = new Map();

// Store details about typings we have loaded
const extraLibs = new Map();

//const codeEditorService = standaloneServices.codeEditorService.get();

const monacoDefaultOptions = {
  lineNumbers: "off",
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  renderLineHighlight: "none",
  automaticLayout: true,
  minimap: {
    enabled: false,
  },
};

monaco.editor.create($("#editor2"), monacoDefaultOptions, {
  codeEditorService: Object.assign(Object.create(codeEditorService), {
    openCodeEditor: async ({ resource, options }, editor) => {
      // Open the file with this path
      // This should set the model with the path and value
      this.props.onOpenPath(resource.path);

      // Move cursor to the desired position
      editor.setSelection(options.selection);

      // Scroll the editor to bring the desired line into focus
      editor.revealLine(options.selection.startLineNumber);

      return Promise.resolve({
        getControl: () => editor,
      });
    },
  }),
});
