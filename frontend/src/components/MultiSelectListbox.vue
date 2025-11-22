<script setup lang="ts">
import { computed, ref, watch } from "vue";

type Primitive = string | number;

export interface ListboxOption {
  label: string;
  value: Primitive;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: ListboxOption[];
    modelValue: Primitive[];
    label?: string;
    height?: string; // e.g. "180px"
    searchable?: boolean;
    placeholder?: string;
    selectAllText?: string;
    clearText?: string;
  }>(),
  {
    height: "180px",
    searchable: false,
    placeholder: "Filter…",
    selectAllText: "Select all",
    clearText: "Clear",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: Primitive[]): void;
  (e: "change", v: Primitive[]): void;
}>();

const query = ref("");
const listRef = ref<HTMLElement | null>(null);
const activeIndex = ref<number>(-1);

// Filtered options (optional search)
const filteredOptions = computed(() => {
  if (!props.searchable || !query.value.trim()) return props.options;
  const q = query.value.toLowerCase();
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

const selectedSet = computed(() => new Set(props.modelValue));

function update(next: Primitive[]) {
  emit("update:modelValue", next);
  emit("change", next);
}

function toggle(value: Primitive) {
  const set = new Set(props.modelValue);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  update([...set]);
}

function isSelected(value: Primitive) {
  return selectedSet.value.has(value);
}

const selectableFiltered = computed(() => filteredOptions.value.filter((o) => !o.disabled));

const allFilteredSelected = computed(
  () => selectableFiltered.value.length > 0 && selectableFiltered.value.every((o) => selectedSet.value.has(o.value))
);

function selectAllFiltered() {
  const set = new Set(props.modelValue);
  for (const o of selectableFiltered.value) set.add(o.value);
  update([...set]);
}

function clearAllFiltered() {
  const set = new Set(props.modelValue);
  for (const o of selectableFiltered.value) set.delete(o.value);
  update([...set]);
}

// Keyboard support: up/down to move, space/enter toggles
function onKeydown(e: KeyboardEvent) {
  const opts = filteredOptions.value;
  if (!opts.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, opts.length - 1);
    scrollActiveIntoView();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    scrollActiveIntoView();
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const opt = opts[activeIndex.value];
    if (opt && !opt.disabled) toggle(opt.value);
  } else if (e.key === "Home") {
    e.preventDefault();
    activeIndex.value = 0;
    scrollActiveIntoView();
  } else if (e.key === "End") {
    e.preventDefault();
    activeIndex.value = opts.length - 1;
    scrollActiveIntoView();
  }
}

function scrollActiveIntoView() {
  const list = listRef.value;
  if (!list) return;
  const el = list.querySelector<HTMLElement>(`[data-index="${activeIndex.value}"]`);
  if (!el) return;

  const listRect = list.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (elRect.top < listRect.top) el.scrollIntoView({ block: "nearest" });
  if (elRect.bottom > listRect.bottom) el.scrollIntoView({ block: "nearest" });
}

// Reset activeIndex when filtering changes
watch(filteredOptions, (opts) => {
  activeIndex.value = opts.length ? 0 : -1;
});
</script>

<template>
  <div class="mslb">
    <label v-if="label" class="mslb__label">{{ label }}</label>

    <div v-if="searchable" class="mslb__search">
      <input
        v-model="query"
        class="mslb__search-input"
        type="text"
        :placeholder="placeholder"
        aria-label="Filter options" />
      <div class="mslb__search-actions">
        <button
          type="button"
          class="mslb__action"
          @click="allFilteredSelected ? clearAllFiltered() : selectAllFiltered()">
          {{ allFilteredSelected ? clearText : selectAllText }}
        </button>
      </div>
    </div>

    <div
      ref="listRef"
      class="mslb__list"
      role="listbox"
      aria-multiselectable="true"
      tabindex="0"
      :style="{ maxHeight: height }"
      @keydown="onKeydown">
      <div
        v-for="(opt, i) in filteredOptions"
        :key="opt.value"
        class="mslb__option"
        :class="{
          'is-selected': isSelected(opt.value),
          'is-disabled': opt.disabled,
          'is-active': i === activeIndex,
        }"
        role="option"
        :aria-selected="isSelected(opt.value)"
        :aria-disabled="!!opt.disabled"
        :data-index="i"
        @click="!opt.disabled && toggle(opt.value)"
        @mousemove="activeIndex = i">
        <input
          class="mslb__checkbox"
          type="checkbox"
          :checked="isSelected(opt.value)"
          :disabled="opt.disabled"
          tabindex="-1"
          aria-hidden="true" />
        <span class="mslb__text">{{ opt.label }}</span>
      </div>

      <div v-if="filteredOptions.length === 0" class="mslb__empty">No options</div>
    </div>
  </div>
</template>

<style scoped>
.mslb {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.mslb__label {
  font-weight: 600;
}

.mslb__search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mslb__search-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  outline: none;
}
.mslb__search-input:focus {
  border-color: #42b983;
}

.mslb__search-actions {
  display: flex;
  gap: 6px;
}
.mslb__action {
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}

.mslb__list {
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  overflow-y: auto;
  padding: 4px;
  outline: none;
}

.mslb__option {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
}
.mslb__option.is-active {
  background: #f3f7f5;
}
.mslb__option.is-selected {
  background: #e9f6ef;
}
.mslb__option.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mslb__checkbox {
  pointer-events: none;
}

.mslb__empty {
  padding: 8px;
  color: #777;
}
</style>
