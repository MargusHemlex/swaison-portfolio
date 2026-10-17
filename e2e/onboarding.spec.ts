import { expect, test, type Page } from "@playwright/test";
async function attach(page: Page, label: string) {
  await page.getByRole("button", { name: `Attach example ${label}` }).click();
  await expect(page.getByRole("status")).toContainText(
    "checklist item attached",
  );
}
test("individual happy path, invalid code, changes requested and final approval", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3108"))
      external.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByLabel("First name")).toHaveValue("Robin");
  if (process.env.UPDATE_SCREENSHOT === "1")
    await page.screenshot({
      path: "docs/assets/onboarding.png",
      fullPage: true,
      animations: "disabled",
    });
  await page
    .getByRole("button", { name: "Create individual application" })
    .click();
  await page.getByLabel("Verification code").fill("000000");
  await page.getByRole("button", { name: "Verify example code" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "synthetic verification code",
  );
  await page.getByLabel("Verification code").fill("424242");
  await page.getByRole("button", { name: "Verify example code" }).click();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await attach(page, "Identity document");
  await attach(page, "Proof of address");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByLabel("Example role").selectOption("reviewer");
  await page
    .getByLabel("Review note")
    .fill("Please recheck the synthetic checklist before resubmitting.");
  await page.getByRole("button", { name: "Request changes" }).click();
  await expect(
    page.getByText("Changes requested", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Example role").selectOption("applicant");
  await page
    .getByRole("button", { name: "Remove Identity document", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "checklist item removed",
  );
  await attach(page, "Identity document");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByLabel("Example role").selectOption("reviewer");
  await page.getByRole("button", { name: "Approve example" }).click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("business addresses, signatory, checklist, review and browser isolation", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Business", exact: true }).click();
  await page
    .getByRole("button", { name: "Create company application" })
    .click();
  await page.getByRole("button", { name: "Save addresses" }).click();
  await expect(page.getByRole("status")).toContainText("addresses saved");
  await page.getByRole("button", { name: "Add example signatory" }).click();
  await expect(page.getByRole("status")).toContainText("signatory added");
  await attach(page, "Incorporation document");
  await attach(page, "Proof of address");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByLabel("Example role").selectOption("reviewer");
  await page.getByRole("button", { name: "Approve example" }).click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  const isolated = await browser.newContext();
  const other = await isolated.newPage();
  await other.goto("http://127.0.0.1:3108");
  await other.getByRole("button", { name: "Business", exact: true }).click();
  await expect(
    other.getByRole("button", { name: "Create company application" }),
  ).toBeVisible();
  await isolated.close();
  await page.getByRole("button", { name: "Reset example workspace" }).click();
  await page.getByRole("button", { name: "Confirm reset" }).click();
  await page.getByLabel("Example role").selectOption("applicant");
  await expect(
    page.getByRole("button", { name: "Create company application" }),
  ).toBeVisible();
});
test("mobile layout keeps registration visible without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Create individual application" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
