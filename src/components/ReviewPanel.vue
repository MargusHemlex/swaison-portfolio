<script setup lang="ts">
import { ref } from "vue";
import type { Status } from "../../shared/contracts";
defineProps<{ status: Status; busy: boolean; reviewNote: string | null }>();
const emit = defineEmits<{
  review: [decision: "approve" | "request-changes", note: string];
}>();
const note = ref(
  "Synthetic checklist reviewed. Example application is complete.",
);
</script>
<template>
  <section class="review-panel">
    <p class="eyebrow">EXAMPLE REVIEWER</p>
    <h3>Make a review decision</h3>
    <p class="muted">
      This role switch illustrates workflow rules. It is not authentication or a
      real identity check.
    </p>
    <form
      v-if="status === 'submitted'"
      @submit.prevent="emit('review', 'approve', note)"
    >
      <label
        >Review note<textarea
          v-model="note"
          required
          minlength="5"
          maxlength="500"
          :disabled="busy"
          rows="3"
        ></textarea>
      </label>
      <div class="button-row">
        <button class="primary" :disabled="busy">Approve example</button
        ><button
          type="button"
          class="secondary"
          :disabled="busy || note.trim().length < 5"
          @click="emit('review', 'request-changes', note)"
        >
          Request changes
        </button>
      </div>
    </form>
    <p v-else-if="status === 'approved'">
      This example is approved. Its review is complete.
    </p>
    <p v-else-if="status === 'changes-requested'">
      Changes have been requested. The applicant can update and resubmit this
      example.
    </p>
    <p v-else>Submit this application as the applicant before reviewing it.</p>
    <blockquote v-if="reviewNote">{{ reviewNote }}</blockquote>
  </section>
</template>
