# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> dashboard filters persist and review verifies documents, checklist, assessment, approval and completion
- Location: tests\admin.spec.ts:13:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('region', { name: 'Agent assessment', exact: true })
Expected substring: "Confidence: 88%"
Received string:    "Agent assessmentAdvisoryAI recommendations support your review. You make the final decision; running an assessment does not change the request status.No assessment yet. Run one when you are ready.Run AI assessmentCurrent request summaryUnder review2 documents · 1 checklist itemsSubmission validationCommunity submission requirements are satisfied.Review checksNo outstanding review warnings."
Timeout: 15000ms

Call log:
  - Expect "toContainText" with timeout 15000ms
  - waiting for getByRole('region', { name: 'Agent assessment', exact: true })
    - locator resolved to <section class="panel _panel_pv8rw_1" aria-labelledby="assessment-heading">…</section>
    - unexpected value "Agent assessmentAdvisoryAI recommendations support your review. You make the final decision; running an assessment does not change the request status.Refreshing assessment and summary…Run AI assessmentCurrent request summaryUnder review2 documents · 1 checklist itemsSubmission validationCommunity submission requirements are satisfied.Review checksNo outstanding review warnings."
    32 × locator resolved to <section class="panel _panel_pv8rw_1" aria-labelledby="assessment-heading">…</section>
       - unexpected value "Agent assessmentAdvisoryAI recommendations support your review. You make the final decision; running an assessment does not change the request status.No assessment yet. Run one when you are ready.Run AI assessmentCurrent request summaryUnder review2 documents · 1 checklist itemsSubmission validationCommunity submission requirements are satisfied.Review checksNo outstanding review warnings."

```

```yaml
- region "Agent assessment":
  - heading "Agent assessment" [level=2]
  - text: Advisory
  - paragraph: AI recommendations support your review. You make the final decision; running an assessment does not change the request status.
  - paragraph: No assessment yet. Run one when you are ready.
  - button "Run AI assessment"
  - heading "Current request summary" [level=3]
  - text: Under review 2 documents · 1 checklist items
  - heading "Submission validation" [level=3]
  - paragraph: Community submission requirements are satisfied.
  - heading "Review checks" [level=3]
  - paragraph: No outstanding review warnings.
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import type { Page } from '@playwright/test';
  3   | 
  4   | const adminId = process.env.E2E_ADMIN_ID;
  5   | const communityId = process.env.E2E_COMMUNITY_ID;
  6   | const residentId = process.env.E2E_RESIDENT_ID;
  7   | const api = process.env.E2E_API_BASE;
  8   | const [approveId, changesId, rejectId] = (process.env.E2E_ADMIN_REQUEST_IDS ?? '').split(',');
  9   | const reviewUrl = (id: string) => `/admin/${adminId}/move-requests/${id}`;
  10  | const expectNotice = (page: Page, message: string) => expect(page.getByRole('status').filter({ hasText: message })).toBeVisible();
  11  | test.beforeAll(() => { expect(adminId && communityId && residentId && api && rejectId, 'Run through the root test:admin-frontend script').toBeTruthy(); });
  12  | 
  13  | test('dashboard filters persist and review verifies documents, checklist, assessment, approval and completion', async ({ page, request }) => {
  14  |   const pageErrors: string[] = [];
  15  |   page.on('pageerror', (error) => pageErrors.push(error.message));
  16  |   await page.goto(`/admin/${adminId}/community/${communityId}`);
  17  |   await expect(page.getByRole('heading', { name: 'Green Heights', exact: true })).toBeVisible();
  18  |   await expect(page.getByRole('region', { name: 'Community request summary' })).toContainText('Under review');
  19  |   await page.getByLabel('Filter by status').selectOption('SUBMITTED');
  20  |   await page.getByLabel('Filter by type').selectOption('MOVE_IN');
  21  |   await expect(page).toHaveURL(/status=SUBMITTED.*type=MOVE_IN/);
  22  |   await page.reload();
  23  |   await expect(page.getByLabel('Filter by status')).toHaveValue('SUBMITTED');
  24  |   await expect(page.getByLabel('Filter by type')).toHaveValue('MOVE_IN');
  25  |   const list = page.getByRole('region', { name: 'All requests', exact: true });
  26  |   await expect(list.getByRole('link', { name: 'View Ananya Rao move in request' })).toHaveCount(2);
  27  |   await expect(list.getByRole('list')).not.toContainText('Move out');
  28  |   await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
  29  |   await list.locator(`a[href="${reviewUrl(approveId)}"]`).click();
  30  |   await expect(page.getByRole('heading', { name: 'Move in request review', exact: true })).toBeVisible();
  31  |   await expect(page.getByRole('region', { name: 'Agent assessment', exact: true })).toContainText('No assessment yet');
  32  |   await page.getByRole('button', { name: 'Start review', exact: true }).click();
  33  |   await expectNotice(page, 'Review started.');
  34  |   await expect(page.getByRole('region', { name: 'Status history', exact: true })).toContainText('Submitted → Under review');
  35  |   const docs = page.getByRole('region', { name: 'Document review', exact: true });
  36  |   await docs.getByRole('button', { name: 'Verify', exact: true }).first().click();
  37  |   await expectNotice(page, 'Document verified.');
  38  |   await docs.getByRole('button', { name: 'Verify', exact: true }).click();
  39  |   await expect(docs.getByRole('button', { name: 'Verify', exact: true })).toHaveCount(0);
  40  |   await page.getByLabel('Review documents status', { exact: true }).selectOption('COMPLETED');
  41  |   await page.getByRole('button', { name: 'Save Review documents status', exact: true }).click();
  42  |   await expect(page.getByRole('region', { name: 'Request checklist', exact: true })).toContainText('Completed');
  43  |   await page.getByLabel('Add a comment for the resident').fill('All documents have been checked.');
  44  |   await page.getByRole('button', { name: 'Add comment', exact: true }).click();
  45  |   await expect(page.getByRole('region', { name: 'Comments', exact: true })).toContainText('All documents have been checked.');
  46  |   await page.getByRole('button', { name: 'Run AI assessment', exact: true }).click();
  47  |   const assessment = page.getByRole('region', { name: 'Agent assessment', exact: true });
> 48  |   await expect(assessment).toContainText('Confidence: 88%');
      |                            ^ Error: expect(locator).toContainText(expected) failed
  49  |   await expect(assessment).toContainText('You make the final decision');
  50  |   await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled();
  51  |   await page.screenshot({ path: 'test-results/admin-review.png', fullPage: true });
  52  |   await page.getByLabel('Decision comment / reason').fill('All requirements verified.');
  53  |   // Cancelling the browser confirmation must not call the decision API.
  54  |   page.once('dialog', (dialog) => dialog.dismiss());
  55  |   await page.getByRole('button', { name: 'Approve', exact: true }).click();
  56  |   expect((await (await request.get(`${api}/move-requests/${approveId}`)).json()).data.status).toBe('UNDER_REVIEW');
  57  |   let approvals = 0;
  58  |   page.on('request', (req) => { if (req.method() === 'POST' && req.url().endsWith(`/${approveId}/approve`)) approvals++; });
  59  |   page.once('dialog', (dialog) => dialog.accept());
  60  |   await page.getByRole('button', { name: 'Approve', exact: true }).click();
  61  |   await expect(page.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
  62  |   expect(approvals).toBe(1);
  63  |   await page.reload();
  64  |   await expect(page.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
  65  |   await page.getByLabel('Completion comment (optional)').fill('Move finished without issues.');
  66  |   await page.getByRole('button', { name: 'Mark completed', exact: true }).click();
  67  |   await expectNotice(page, 'Request marked completed.');
  68  |   await expect(page.getByRole('region', { name: 'Audit log', exact: true })).toContainText('Move request completed');
  69  |   await expect(page.getByRole('region', { name: 'Status history', exact: true })).toContainText('Approved → Completed');
  70  |   await page.getByRole('link', { name: 'Back to admin dashboard', exact: false }).click();
  71  |   await expect(page.getByLabel('Filter by status')).toHaveValue('SUBMITTED');
  72  |   await expect(page.getByLabel('Filter by type')).toHaveValue('MOVE_IN');
  73  |   await expect(list.getByRole('link', { name: 'View Ananya Rao move in request' })).toHaveCount(1);
  74  |   expect(pageErrors).toEqual([]);
  75  | });
  76  | 
  77  | test('document rejection, reasons, changes, resubmission and manual rejection after AI failure', async ({ page, request }) => {
  78  |   await page.goto(reviewUrl(changesId));
  79  |   await page.getByRole('button', { name: 'Start review', exact: true }).click();
  80  |   await expect(page.getByRole('button', { name: 'Request changes', exact: true })).toBeEnabled();
  81  |   await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  82  |   await expect(page.locator('#decision-error')).toContainText('Enter a reason');
  83  |   await page.getByRole('button', { name: 'Reject document', exact: true }).click();
  84  |   await page.getByLabel('Document rejection reason').fill('Document is unclear.');
  85  |   await page.getByRole('button', { name: 'Save document rejection', exact: true }).click();
  86  |   await expect(page.getByRole('region', { name: 'Document review', exact: true })).toContainText('Rejected');
  87  |   await page.getByLabel('Review documents status', { exact: true }).selectOption('NOT_APPLICABLE');
  88  |   await page.getByRole('button', { name: 'Save Review documents status', exact: true }).click();
  89  |   await expectNotice(page, 'Checklist item updated.');
  90  |   await page.getByLabel('Review documents status', { exact: true }).selectOption('PENDING');
  91  |   await page.getByRole('button', { name: 'Save Review documents status', exact: true }).click();
  92  |   await expectNotice(page, 'Checklist item updated.');
  93  |   await page.getByLabel('Decision comment / reason').fill('Please replace the unclear identity document.');
  94  |   await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  95  |   await expectNotice(page, 'Changes requested.');
  96  |   await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  97  |   const residentView = await (await request.get(`${api}/move-requests/${changesId}`)).json();
  98  |   const replaced = await request.patch(`${api}/move-requests/${changesId}/documents/${residentView.data.documents[0].id}`, { data: { fileUrl: 'https://example.test/clear.pdf' } });
  99  |   expect(replaced.status()).toBe(200);
  100 |   expect((await request.post(`${api}/move-requests/${changesId}/submit`)).status()).toBe(200);
  101 |   await page.reload();
  102 |   await expect(page.getByRole('button', { name: 'Start review', exact: true })).toBeVisible();
  103 | 
  104 |   await page.goto(reviewUrl(rejectId));
  105 |   await page.getByRole('button', { name: 'Start review', exact: true }).click();
  106 |   await expect(page.getByRole('button', { name: 'Run AI assessment', exact: true })).toBeEnabled();
  107 |   await page.getByRole('button', { name: 'Run AI assessment', exact: true }).click();
  108 |   await expect(page.getByRole('alert')).toContainText('No changes were saved');
  109 |   await expect(page.getByRole('button', { name: 'Reject', exact: true })).toBeEnabled();
  110 |   await page.getByRole('button', { name: 'Reject', exact: true }).click();
  111 |   await expect(page.locator('#decision-error')).toContainText('Enter a reason');
  112 |   await page.getByLabel('Decision comment / reason').fill('Community requirements are not satisfied.');
  113 |   page.once('dialog', (dialog) => dialog.accept());
  114 |   await page.getByRole('button', { name: 'Reject', exact: true }).click();
  115 |   await expectNotice(page, 'Request rejected.');
  116 |   await expect(page.getByRole('region', { name: 'Comments', exact: true })).toContainText('Community requirements are not satisfied.');
  117 | });
  118 | 
  119 | test('mobile layout, cross-community errors and duplicate-action protection', async ({ page, request }) => {
  120 |   await page.setViewportSize({ width: 390, height: 844 });
  121 |   const created = await request.post(`${api}/move-requests`, { data: { residentId, type: 'MOVE_OUT' } });
  122 |   const id = (await created.json()).data.id;
  123 |   await request.patch(`${api}/move-requests/${id}`, { data: { requestedDate: '2026-09-07', requestedTimeSlot: '09:00-12:00', movingCompany: 'Local Movers', vehicleCount: 1 } });
  124 |   await request.post(`${api}/move-requests/${id}/documents`, { data: { documentType: 'IDENTITY_DOCUMENT', fileUrl: 'https://example.test/id.pdf' } });
  125 |   expect((await request.post(`${api}/move-requests/${id}/submit`)).status()).toBe(200);
  126 |   await page.goto(reviewUrl(id));
  127 |   await expect(page.getByRole('button', { name: 'Start review', exact: true })).toBeEnabled();
  128 |   let starts = 0;
  129 |   page.on('request', (req) => { if (req.method() === 'POST' && req.url().endsWith(`/${id}/review`)) starts++; });
  130 |   // Dispatch two clicks in one browser turn to exercise the synchronous write lock.
  131 |   await page.getByRole('button', { name: 'Start review', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  132 |   await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled();
  133 |   expect(starts).toBe(1);
  134 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  135 |   await page.screenshot({ path: 'test-results/admin-mobile.png', fullPage: true });
  136 |   // A stale review page must reconcile a status change, not overwrite it.
  137 |   expect((await request.post(`${api}/admin/move-requests/${id}/approve`, { data: { adminId } })).status()).toBe(200);
  138 |   await page.getByLabel('Decision comment / reason').fill('Stale request changes');
  139 |   await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  140 |   await expect(page.getByRole('alert')).toContainText('Cannot change status');
  141 |   await expect(page.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
  142 |   await page.goto(`/admin/${process.env.E2E_OUTSIDE_ADMIN_ID}/move-requests/${id}`);
  143 |   await expect(page.getByRole('alert')).toContainText('community');
  144 |   await expect(page.getByRole('heading', { name: 'Resident & unit', exact: true })).toHaveCount(0);
  145 |   await page.goto(`/admin/${adminId}/move-requests/00000000-0000-4000-8000-000000000001`);
  146 |   await expect(page.getByRole('alert')).toContainText('not found');
  147 | });
  148 | 
```