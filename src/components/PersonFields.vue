<script setup lang="ts">
import { reactive } from "vue";
import type { Person } from "../../shared/contracts";
const props = defineProps<{
  label: string;
  disabled: boolean;
  signatory?: boolean;
}>();
const emit = defineEmits<{ save: [person: Person] }>();
const person = reactive<Person>({
  firstName: props.signatory ? "Alex" : "Robin",
  lastName: "Sample",
  email: props.signatory ? "alex@example.test" : "robin@example.test",
});
</script>
<template>
  <form class="form-grid" @submit.prevent="emit('save', { ...person })">
    <label
      >First name<input
        v-model="person.firstName"
        required
        minlength="2"
        maxlength="100"
        :disabled="disabled"
        autocomplete="off"
    /></label>
    <label
      >Last name<input
        v-model="person.lastName"
        required
        minlength="2"
        maxlength="100"
        :disabled="disabled"
        autocomplete="off"
    /></label>
    <label class="span-two"
      >Synthetic email<input
        v-model="person.email"
        type="email"
        required
        maxlength="120"
        pattern=".+@example\.test"
        :disabled="disabled"
        autocomplete="off"
      /><span class="field-hint"
        >Use an @example.test address. No email is sent.</span
      ></label
    >
    <button class="primary span-two" :disabled="disabled" type="submit">
      {{ label }} <span aria-hidden="true">→</span>
    </button>
  </form>
</template>
