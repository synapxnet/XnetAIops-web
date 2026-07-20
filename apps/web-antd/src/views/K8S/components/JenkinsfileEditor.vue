<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { foldGutter, indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';

const props = withDefaults(defineProps<{
  theme?: 'light' | 'dark';
  height?: string;
  readOnly?: boolean;
}>(), {
  theme: 'dark',
  height: '400px',
  readOnly: false,
});

const modelValue = defineModel<string>({ default: '' });
const editorRef = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;
let isUpdating = false;

function createExtensions() {
  const extensions = [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    foldGutter(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    highlightSelectionMatches(),
    history(),
    javascript(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([
      ...defaultKeymap, ...historyKeymap,
      ...closeBracketsKeymap, ...searchKeymap, indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdating) {
        modelValue.value = update.state.doc.toString();
      }
    }),
    EditorView.theme({
      '&': { height: props.height, borderRadius: '6px', border: '1px solid #d9d9d9', fontSize: '13px' },
      '.cm-scroller': { overflow: 'auto', fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" },
      '.cm-gutters': { borderRight: '1px solid #e8e8e8' },
    }),
  ];
  if (props.theme === 'dark') extensions.push(oneDark);
  if (props.readOnly) extensions.push(EditorState.readOnly.of(true));
  return extensions;
}

onMounted(() => {
  if (!editorRef.value) return;
  view = new EditorView({
    state: EditorState.create({ doc: modelValue.value, extensions: createExtensions() }),
    parent: editorRef.value,
  });
});

watch(modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    isUpdating = true;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newVal } });
    isUpdating = false;
  }
});

onBeforeUnmount(() => { view?.destroy(); view = null; });

defineExpose({
  getContent: () => view?.state.doc.toString() ?? '',
  focus: () => view?.focus(),
});
</script>

<template>
  <div ref="editorRef" class="jenkinsfile-editor" />
</template>

<style scoped>
.jenkinsfile-editor { width: 100%; }
.jenkinsfile-editor :deep(.cm-editor) { border-radius: 6px; }
.jenkinsfile-editor :deep(.cm-editor.cm-focused) {
  outline: none; border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
}
</style>
