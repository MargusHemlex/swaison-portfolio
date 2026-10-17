<script setup lang="ts">
import type { DocumentRecord, Kind } from "../../shared/contracts";
const props = defineProps<{
  kind: Kind;
  documents: DocumentRecord[];
  editable: boolean;
  busy: boolean;
}>();
const emit = defineEmits<{
  attach: [type: DocumentRecord["type"]];
  remove: [type: DocumentRecord["type"]];
}>();
const types: DocumentRecord["type"][] =
  props.kind === "individual"
    ? ["identity", "address"]
    : ["incorporation", "address"];
const labels = {
  identity: "Identity document",
  address: "Proof of address",
  incorporation: "Incorporation document",
};
</script>
<template>
  <div class="checklist">
    <div v-for="type in types" :key="type" class="checklist-row">
      <span class="document-icon" aria-hidden="true">▤</span>
      <div>
        <strong>{{ labels[type] }}</strong
        ><small>{{
          documents.some((d) => d.type === type)
            ? `synthetic-${type}.pdf · metadata only`
            : "Synthetic checklist item · no file required"
        }}</small>
      </div>
      <div
        v-if="documents.some((d) => d.type === type)"
        class="document-actions"
      >
        <span class="attached">✓ Attached</span>
        <button
          v-if="editable"
          class="text-button"
          :disabled="busy"
          @click="emit('remove', type)"
        >
          Remove<span class="sr-only"> {{ labels[type] }}</span>
        </button>
      </div>
      <button
        v-else-if="editable"
        class="text-button"
        :disabled="busy"
        @click="emit('attach', type)"
      >
        Attach example<span class="sr-only"> {{ labels[type] }}</span>
      </button>
      <span v-else class="muted">Missing</span>
    </div>
  </div>
</template>
