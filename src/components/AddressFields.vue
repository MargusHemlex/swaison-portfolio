<script setup lang="ts">
import { reactive } from "vue";
import type { Address } from "../../shared/contracts";
const props = defineProps<{
  disabled: boolean;
  savedRegistration: Address | null;
  savedOperating: Address | null;
}>();
const emit = defineEmits<{
  save: [registration: Address, operating: Address];
}>();
const registration = reactive<Address>({
  ...(props.savedRegistration ?? {
    street: "12 Example Street",
    city: "Tallinn",
    country: "EE",
  }),
});
const operating = reactive<Address>({
  ...(props.savedOperating ?? {
    street: "24 Sample Avenue",
    city: "Tartu",
    country: "EE",
  }),
});
</script>
<template>
  <form
    class="address-form"
    @submit.prevent="emit('save', { ...registration }, { ...operating })"
  >
    <fieldset
      v-for="(address, index) in [registration, operating]"
      :key="index"
      :disabled="disabled"
    >
      <legend>
        {{ index === 0 ? "Registration address" : "Operating address" }}
      </legend>
      <div class="form-grid">
        <label class="span-two"
          >Street<input
            v-model="address.street"
            required
            minlength="2"
            maxlength="100"
            autocomplete="off"
        /></label>
        <label
          >City<input
            v-model="address.city"
            required
            minlength="2"
            maxlength="100"
            autocomplete="off"
        /></label>
        <label
          >Country<select v-model="address.country">
            <option value="EE">Estonia</option>
            <option value="LV">Latvia</option>
            <option value="LT">Lithuania</option>
          </select></label
        >
      </div>
    </fieldset>
    <button class="secondary" :disabled="disabled">Save addresses</button>
  </form>
</template>
