<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { statusLabel, VERIFICATION_CODE, type Kind } from "../shared/contracts";
import { useWorkspace } from "./useWorkspace";
import PersonFields from "./components/PersonFields.vue";
import AddressFields from "./components/AddressFields.vue";
import DocumentChecklist from "./components/DocumentChecklist.vue";
import ReviewPanel from "./components/ReviewPanel.vue";
const { workspace, role, busy, error, notice, load, send } = useWorkspace();
const kind = ref<Kind>("individual");
const application = computed(() => workspace.value?.[kind.value] ?? null);
const editable = computed(
  () =>
    role.value === "applicant" &&
    !!application.value &&
    ["draft", "changes-requested"].includes(application.value.status),
);
const company = reactive({
  name: "Northstar Example OÜ",
  registrationCode: "SYN-1001",
});
const code = ref("");
const about = ref(false);
const resetConfirm = ref(false);
const steps = computed(() =>
  kind.value === "individual"
    ? [
        { title: "Your details", done: !!application.value },
        {
          title: "Example verification",
          done:
            !!application.value &&
            application.value.status !== "awaiting-verification",
        },
        {
          title: "Document checklist",
          done: application.value?.documents.length === 2,
        },
        {
          title: "Review & decision",
          done: application.value?.status === "approved",
        },
      ]
    : [
        { title: "Company details", done: !!application.value },
        {
          title: "Addresses & people",
          done:
            !!workspace.value?.company?.registration &&
            !!workspace.value.company.operating &&
            !!workspace.value.company.signatories.length,
        },
        {
          title: "Document checklist",
          done: application.value?.documents.length === 2,
        },
        {
          title: "Review & decision",
          done: application.value?.status === "approved",
        },
      ],
);
onMounted(load);
</script>
<template>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="wordmark" href="/" aria-label="Swaison home"
        ><span class="brand-symbol" aria-hidden="true">s</span>swaison<span
          class="brand-dot"
          >.</span
        ></a
      >
      <div class="workspace-label">PORTFOLIO EDITION</div>
      <div class="sidebar-heading">WORKSPACE</div>
      <div class="nav-active">
        <span aria-hidden="true">▦</span> Onboarding portal
        <span class="nav-dot"></span>
      </div>
      <button class="nav-link" :aria-expanded="about" @click="about = !about">
        <span aria-hidden="true">ⓘ</span> How it works
      </button>
      <div class="sidebar-heading progress-heading">YOUR APPLICATION</div>
      <ol class="steps">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          :class="{ complete: step.done }"
        >
          <span class="step-number">{{
            step.done ? "✓" : String(index + 1).padStart(2, "0")
          }}</span
          ><span>{{ step.title }}</span>
        </li>
      </ol>
      <div class="sidebar-note">
        <span class="note-mark" aria-hidden="true">◇</span
        ><strong>A safe place to explore.</strong>
        <p>
          Every document and identity here is synthetic. Nothing is sent to a
          production service.
        </p>
      </div>
      <div class="sidebar-footer">Built for clarity. Designed for trust.</div>
    </aside>
    <div class="main-shell">
      <header class="topbar">
        <div>
          <span class="breadcrumb">Workspace</span
          ><span class="slash">/</span>Onboarding
        </div>
        <span class="environment"><span></span>Synthetic environment</span>
      </header>
      <main>
        <div class="page-heading">
          <div>
            <p class="eyebrow">A CLEAR PATH FORWARD</p>
            <h1>Good beginnings,<br /><em>built on confidence.</em></h1>
            <p class="intro">
              Explore a considered onboarding journey, from the first detail<br
                class="desktop-break"
              />
              to a clear, traceable decision.
            </p>
          </div>
          <div class="edition-stamp">
            <span aria-hidden="true">✳</span
            ><small>NO REAL DATA.<br />REAL WORKFLOW.</small>
          </div>
        </div>
        <section v-if="about" class="info-panel">
          <h2>From application to decision</h2>
          <p>
            The applicant completes a synthetic checklist and submits it. The
            example reviewer can approve or request changes. Every accepted
            action produces a sequenced event; invalid transitions are rejected
            by the API.
          </p>
          <p>
            Role selection is an illustration, not access control. State is
            local, temporary and scoped to a browser cookie. No email, identity
            check, actual document, payment or external integration is involved.
          </p>
        </section>
        <div class="example-banner">
          <span aria-hidden="true">◇</span>
          <p>
            <strong>Explore with example data.</strong> Use the prefilled
            synthetic details. Please do not enter personal information or real
            identity documents.
          </p>
        </div>
        <div class="workspace-toolbar">
          <div class="tab-group" aria-label="Application type">
            <button
              :class="{ selected: kind === 'individual' }"
              :aria-pressed="kind === 'individual'"
              @click="kind = 'individual'"
            >
              Individual</button
            ><button
              :class="{ selected: kind === 'company' }"
              :aria-pressed="kind === 'company'"
              @click="kind = 'company'"
            >
              Business
            </button>
          </div>
          <label class="role-select"
            >Example role<select v-model="role" :disabled="busy">
              <option value="applicant">Applicant</option>
              <option value="reviewer">Reviewer</option>
            </select></label
          >
        </div>
        <div v-if="error" class="alert error" role="alert">{{ error }}</div>
        <p v-if="notice" class="alert success" role="status">{{ notice }}</p>
        <div v-if="!workspace" class="card">
          <p>
            {{
              busy
                ? "Loading your example workspace…"
                : "The workspace could not be loaded."
            }}
          </p>
          <button v-if="!busy" class="secondary" @click="load">
            Reload workspace
          </button>
        </div>
        <div v-else class="content-grid">
          <section class="card application-card">
            <div class="card-heading">
              <div>
                <p class="eyebrow">
                  {{
                    kind === "individual"
                      ? "PERSONAL ONBOARDING"
                      : "CORPORATE ONBOARDING"
                  }}
                </p>
                <h2>
                  {{
                    application
                      ? kind === "individual"
                        ? "Your application"
                        : "Company application"
                      : kind === "individual"
                        ? "Let’s start with you."
                        : "A foundation for your business."
                  }}
                </h2>
              </div>
              <span
                v-if="application"
                class="status-badge"
                :class="application.status"
                >{{ statusLabel[application.status] }}</span
              ><span v-else class="step-caption">STEP 01 / 04</span>
            </div>
            <template v-if="!application">
              <p class="section-intro">
                {{
                  kind === "individual"
                    ? "A few simple details to begin your example application."
                    : "Start with a synthetic company. Addresses and people come next."
                }}
              </p>
              <p v-if="role === 'reviewer'" class="muted">
                Choose the applicant role to create an application.
              </p>
              <PersonFields
                v-else-if="kind === 'individual'"
                label="Create individual application"
                :disabled="busy"
                @save="
                  (person) => send({ type: 'register-individual', person })
                "
              />
              <form
                v-else
                class="form-grid"
                @submit.prevent="send({ type: 'register-company', ...company })"
              >
                <label class="span-two"
                  >Company name<input
                    v-model="company.name"
                    required
                    minlength="2"
                    maxlength="100"
                    :disabled="busy" /></label
                ><label class="span-two"
                  >Synthetic registration code<input
                    v-model="company.registrationCode"
                    required
                    pattern="SYN-\d{4}"
                    :disabled="busy"
                  /><span class="field-hint"
                    >Example format: SYN-1001</span
                  ></label
                ><button class="primary span-two" :disabled="busy">
                  Create company application <span aria-hidden="true">→</span>
                </button>
              </form>
            </template>
            <template v-else>
              <div class="identity-summary">
                <span class="avatar" aria-hidden="true">{{
                  kind === "individual" ? "RS" : "N"
                }}</span>
                <div>
                  <strong>{{
                    kind === "individual"
                      ? `${workspace.individual!.person.firstName} ${workspace.individual!.person.lastName}`
                      : workspace.company!.name
                  }}</strong
                  ><small>{{
                    kind === "individual"
                      ? workspace.individual!.person.email
                      : workspace.company!.registrationCode
                  }}</small>
                </div>
                <span class="synthetic-label">SYNTHETIC</span>
              </div>
              <template v-if="role === 'applicant'">
                <form
                  v-if="application.status === 'awaiting-verification'"
                  class="verification-panel"
                  @submit.prevent="send({ type: 'verify-individual', code })"
                >
                  <h3>One small verification step.</h3>
                  <p>
                    Nothing is emailed. Your synthetic code is
                    <strong>{{ VERIFICATION_CODE }}</strong
                    >.
                  </p>
                  <label
                    >Verification code<input
                      v-model="code"
                      required
                      pattern="\d{6}"
                      maxlength="6"
                      inputmode="numeric"
                      :disabled="busy" /></label
                  ><button class="primary" :disabled="busy">
                    Verify example code
                  </button>
                </form>
              </template>
              <template v-if="kind === 'company'">
                <section class="section-block">
                  <h3>Addresses</h3>
                  <AddressFields
                    v-if="editable"
                    :saved-registration="workspace.company!.registration"
                    :saved-operating="workspace.company!.operating"
                    :disabled="busy"
                    @save="
                      (registration, operating) =>
                        send({
                          type: 'set-addresses',
                          registration,
                          operating,
                        })
                    "
                  />
                  <div
                    v-if="workspace.company!.registration"
                    class="saved-detail"
                  >
                    ✓ Registration:
                    {{ workspace.company!.registration.street }},
                    {{ workspace.company!.registration.city }}<br />✓ Operating:
                    {{ workspace.company!.operating?.street }},
                    {{ workspace.company!.operating?.city }}
                  </div>
                </section>
                <section class="section-block">
                  <h3>Authorized signatories</h3>
                  <ul
                    v-if="workspace.company!.signatories.length"
                    class="people-list"
                  >
                    <li
                      v-for="person in workspace.company!.signatories"
                      :key="person.email"
                    >
                      {{ person.firstName }} {{ person.lastName }}
                      <small>{{ person.email }}</small>
                    </li>
                  </ul>
                  <PersonFields
                    v-if="editable && workspace.company!.signatories.length < 3"
                    signatory
                    label="Add example signatory"
                    :disabled="busy"
                    @save="(person) => send({ type: 'add-signatory', person })"
                  />
                </section>
              </template>
              <section
                v-if="application.status !== 'awaiting-verification'"
                class="section-block"
              >
                <h3>Document checklist</h3>
                <p class="muted">
                  Attach synthetic metadata. No files are uploaded or stored.
                </p>
                <DocumentChecklist
                  :key="kind"
                  :kind="kind"
                  :documents="application.documents"
                  :editable="editable"
                  :busy="busy"
                  @remove="
                    (document) =>
                      send({ type: 'remove-document', kind, document })
                  "
                  @attach="
                    (document) =>
                      send({ type: 'attach-document', kind, document })
                  "
                />
              </section>
              <ReviewPanel
                v-if="role === 'reviewer'"
                :key="`${kind}-${application.status}`"
                :status="application.status"
                :busy="busy"
                :review-note="application.reviewNote"
                @review="
                  (decision, note) =>
                    send({ type: 'review', kind, decision, note })
                "
              />
              <template v-else>
                <blockquote v-if="application.reviewNote">
                  {{ application.reviewNote }}
                </blockquote>
                <div v-if="editable" class="submit-row">
                  <span class="muted"
                    >Complete each section before submitting.</span
                  ><button
                    class="primary"
                    :disabled="busy"
                    @click="send({ type: 'submit', kind })"
                  >
                    Submit for review <span aria-hidden="true">→</span>
                  </button>
                </div>
                <p
                  v-if="application.status === 'submitted'"
                  class="completion-note"
                >
                  Your example is ready for review. Choose the reviewer role to
                  continue.
                </p>
                <p
                  v-if="application.status === 'approved'"
                  class="completion-note"
                >
                  ✓ This example journey is complete. No real account has been
                  opened.
                </p>
              </template>
            </template>
            <div class="card-footnote">
              <span aria-hidden="true">◈</span> Independent portfolio edition ·
              No real identity verification
            </div>
          </section>
          <aside class="right-column">
            <section class="guidance-card">
              <span class="large-mark" aria-hidden="true">↗</span>
              <p class="eyebrow">THOUGHTFUL BY DESIGN</p>
              <h3>The next step<br />is always clear.</h3>
              <p>
                Structured information. Explicit states. A decision you can
                follow.
              </p>
              <div class="guidance-rule"></div>
              <div class="fact-row">
                <span>01</span>
                <p>Complete the example details</p>
              </div>
              <div class="fact-row">
                <span>02</span>
                <p>Build your synthetic checklist</p>
              </div>
              <div class="fact-row">
                <span>03</span>
                <p>Switch roles and review</p>
              </div>
            </section>
            <section class="activity-card">
              <div class="activity-heading">
                <h3>Activity trail</h3>
                <span>{{ workspace.events.length }}</span>
              </div>
              <p v-if="!workspace.events.length" class="muted">
                Your first action starts the trail.
              </p>
              <ol v-else class="activity-list">
                <li
                  v-for="event in workspace.events.slice(-6).reverse()"
                  :key="event.sequence"
                >
                  <span class="activity-dot"></span>
                  <div>
                    <strong>{{ event.detail }}</strong
                    ><small
                      >#{{ String(event.sequence).padStart(2, "0") }} ·
                      {{ event.role }}</small
                    >
                  </div>
                </li>
              </ol>
              <small class="muted"
                >Sequenced example events, not a tamper-proof audit log.</small
              >
            </section>
          </aside>
        </div>
        <footer class="page-footer">
          <span
            >SWAISON <span class="footer-divider">/</span> ONBOARDING,
            CONSIDERED.</span
          ><button
            v-if="!resetConfirm"
            class="text-button"
            :disabled="busy || !workspace"
            @click="resetConfirm = true"
          >
            Reset example workspace
          </button>
          <div v-else class="button-row">
            <span>Clear this browser’s examples?</span
            ><button
              class="text-button"
              :disabled="busy"
              @click="
                send({ type: 'reset' });
                resetConfirm = false;
              "
            >
              Confirm reset</button
            ><button class="text-button" @click="resetConfirm = false">
              Cancel
            </button>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>
