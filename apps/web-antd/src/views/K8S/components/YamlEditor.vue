<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { usePreferences } from '@vben/preferences';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { foldGutter, indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';

const props = withDefaults(defineProps<{
  theme?: 'auto' | 'light' | 'dark';
  height?: string;
  readOnly?: boolean;
  placeholder?: string;
}>(), {
  theme: 'auto',
  height: '400px',
  readOnly: false,
  placeholder: '',
});

const modelValue = defineModel<string>({ default: '' });
const editorRef = ref<HTMLDivElement | null>(null);
const { isDark } = usePreferences();
const effectiveTheme = computed(() =>
  props.theme === 'auto' ? (isDark.value ? 'dark' : 'light') : props.theme,
);
const themeCompartment = new Compartment();
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
    yaml(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    themeCompartment.of(effectiveTheme.value === 'dark' ? oneDark : []),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdating) {
        modelValue.value = update.state.doc.toString();
      }
    }),
    EditorView.theme({
      '&': { height: props.height, borderRadius: '6px', border: '1px solid hsl(var(--border))', fontSize: '13px' },
      '.cm-scroller': { overflow: 'auto', fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" },
      '.cm-gutters': { borderRight: '1px solid hsl(var(--border))' },
    }),
  ];

  if (props.readOnly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  return extensions;
}

function mountEditor() {
  if (!editorRef.value) return;
  const state = EditorState.create({
    doc: modelValue.value,
    extensions: createExtensions(),
  });
  view = new EditorView({ state, parent: editorRef.value });
}

onMounted(mountEditor);

watch(effectiveTheme, (theme) => {
  view?.dispatch({
    effects: themeCompartment.reconfigure(theme === 'dark' ? oneDark : []),
  });
});

watch(modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    isUpdating = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal },
    });
    isUpdating = false;
  }
});

onBeforeUnmount(() => {
  view?.destroy();
  view = null;
});

defineExpose({
  getContent: () => view?.state.doc.toString() ?? '',
  focus: () => view?.focus(),
});
</script>

<template>
  <div ref="editorRef" class="yaml-editor" />
</template>

<style scoped>
.yaml-editor {
  width: 100%;
}
.yaml-editor :deep(.cm-editor) {
  border-radius: 6px;
}
.yaml-editor :deep(.cm-editor.cm-focused) {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
