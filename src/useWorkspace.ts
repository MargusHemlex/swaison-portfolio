import { ref } from "vue";
import type { Command, Role, Workspace } from "../shared/contracts";
export function useWorkspace() {
  const workspace = ref<Workspace | null>(null);
  const role = ref<Role>("applicant");
  const busy = ref(false);
  const error = ref("");
  const notice = ref("");
  async function request(path: string, init?: RequestInit): Promise<Workspace> {
    const response = await fetch(path, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message ?? "The request failed.");
    return data.workspace;
  }
  async function load() {
    busy.value = true;
    error.value = "";
    try {
      workspace.value = await request("/api/workspace");
    } catch {
      error.value =
        "Workspace unavailable. Start the local server and refresh this page.";
    } finally {
      busy.value = false;
    }
  }
  async function send(command: Command) {
    if (busy.value || !workspace.value) return;
    busy.value = true;
    error.value = "";
    notice.value = "";
    try {
      workspace.value = await request("/api/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Example-Role": role.value,
        },
        body: JSON.stringify({
          expectedRevision: workspace.value.revision,
          command,
        }),
      });
      notice.value =
        workspace.value.events.at(-1)?.detail ?? "Workspace updated";
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : "The request failed.";
      // A timeout may follow a committed mutation; refresh before the next command.
      try {
        workspace.value = await request("/api/workspace");
      } catch {
        workspace.value = null;
        error.value += " Reload the workspace before continuing.";
      }
    } finally {
      busy.value = false;
    }
  }
  return { workspace, role, busy, error, notice, load, send };
}
