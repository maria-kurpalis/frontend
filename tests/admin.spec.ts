import { expect, test, loginAs } from './fixtures';
import type { Page } from '@playwright/test';

const adminId = process.env.E2E_ADMIN_ID;
const communityId = process.env.E2E_COMMUNITY_ID;
const residentId = process.env.E2E_RESIDENT_ID;
const api = process.env.E2E_API_BASE;
test.beforeEach(async ({ page }) => { await loginAs(page, 'meera.desai@green-heights.example.test'); });
const [approveId, changesId, rejectId] = (process.env.E2E_ADMIN_REQUEST_IDS ?? '').split(',');
const reviewUrl = (id: string) => `/admin/${adminId}/move-requests/${id}`;
const expectNotice = (page: Page, message: string) => expect(page.getByRole('status').filter({ hasText: message })).toBeVisible();
test.beforeAll(() => { expect(adminId && communityId && residentId && api && rejectId, 'Run through the root test:admin-frontend script').toBeTruthy(); });

test('dashboard filters persist and review verifies documents, checklist, assessment, approval and completion', async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`/admin/${adminId}/community/${communityId}`);
  await expect(page.getByRole('heading', { name: 'Green Heights', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Community request summary' })).toContainText('Under review');
  await expect(page.getByRole('region', { name: 'Notifications', exact: true })).toContainText('New move request submitted');
  await page.getByLabel('Filter by status').selectOption('SUBMITTED');
  await page.getByLabel('Filter by type').selectOption('MOVE_IN');
  await expect(page).toHaveURL(/status=SUBMITTED.*type=MOVE_IN/);
  await page.reload();
  await expect(page.getByLabel('Filter by status')).toHaveValue('SUBMITTED');
  await expect(page.getByLabel('Filter by type')).toHaveValue('MOVE_IN');
  const list = page.getByRole('region', { name: 'All requests', exact: true });
  await expect(list.getByRole('link', { name: 'View Ananya Rao move in request' })).toHaveCount(2);
  await expect(list.getByRole('list')).not.toContainText('Move out');
  await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
  await list.locator(`a[href="${reviewUrl(approveId)}"]`).click();
  await expect(page.getByRole('heading', { name: 'Move in request review', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Agent assessment', exact: true })).toContainText('No assessment yet');
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expectNotice(page, 'Review started.');
  await expect(page.getByRole('region', { name: 'Status history', exact: true })).toContainText('Under Review');
  const docs = page.getByRole('region', { name: 'Document review', exact: true });
  await expect(page.getByText('Moving company', { exact: true })).toHaveCount(0);
  await expect(docs).not.toContainText('Tenancy agreement');
  // Optional uploaded documents can still be rejected, replaced and verified.
  await docs.getByRole('button', { name: 'Reject document', exact: true }).click();
  await page.getByLabel('Document rejection reason').fill('Please provide a clearer identity document.');
  await page.getByRole('button', { name: 'Save document rejection', exact: true }).click();
  await expectNotice(page, 'Document rejected.');
  await page.getByRole('button', { name: 'Run AI assessment', exact: true }).click();
  const initialAssessment = page.getByRole('region', { name: 'Agent assessment', exact: true });
  await expect(initialAssessment).toContainText('Manual Review');
  await expect(initialAssessment).not.toContainText('IDENTITY_DOCUMENT was rejected');
  expect((await (await request.get(`${api}/move-requests/${approveId}`)).json()).data.status).toBe('UNDER_REVIEW');
  await page.getByLabel('Decision comment / reason').fill('Please replace the rejected document.');
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expectNotice(page, 'Changes requested.');
  await loginAs(page, 'ananya.rao@green-heights.example.test');
  await page.goto(`/resident/${residentId}/move-requests/${approveId}`);
  await expect(page.getByRole('region', { name: 'Changes requested' })).toContainText('Please replace the rejected document.');
  const rejectedRow = page.getByRole('region', { name: 'Supporting Documents (Optional)', exact: true }).locator('.document-row').filter({ hasText: 'Rejected' });
  await rejectedRow.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByLabel('New file URL').fill('https://example.test/clear-identity.pdf');
  await page.getByRole('button', { name: 'Save replacement' }).click();
  await expectNotice(page, 'Document replaced.');
  await page.getByRole('button', { name: 'Resubmit request', exact: true }).click();
  await expectNotice(page, 'Request submitted.');
  await loginAs(page, 'meera.desai@green-heights.example.test');
  await page.goto(`/admin/${adminId}/community/${communityId}?status=SUBMITTED&type=MOVE_IN`);
  await expect(page.getByRole('region', { name: 'Notifications', exact: true })).toContainText('Move request resubmitted');
  await page.getByRole('region', { name: 'All requests', exact: true }).locator(`a[href="${reviewUrl(approveId)}"]`).click();
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expectNotice(page, 'Review started.');
  await docs.getByRole('button', { name: 'Verify', exact: true }).click();
  await expectNotice(page, 'Document verified.');
  await expect(docs).toContainText('Reviewed by Meera Desai');
  await expect(docs.getByRole('button', { name: 'Verify', exact: true })).toHaveCount(0);
  await page.getByLabel('Review documents status', { exact: true }).selectOption('COMPLETED');
  await page.getByRole('button', { name: 'Save Review documents status', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Request checklist', exact: true })).toContainText('Completed');
  await page.getByLabel('Add a comment for the resident').fill('All documents have been checked.');
  await page.getByRole('button', { name: 'Add comment', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Comments', exact: true })).toContainText('All documents have been checked.');
  await page.getByRole('button', { name: 'Run AI assessment', exact: true }).click();
  const assessment = page.getByRole('region', { name: 'Agent assessment', exact: true });
  await expect(assessment).toContainText('Confidence: 88%');
  await expect(assessment).toContainText('You make the final decision');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled();
  await page.screenshot({ path: 'test-results/admin-review.png', fullPage: true });
  await page.getByLabel('Decision comment / reason').fill('All requirements verified.');
  // Cancelling the browser confirmation must not call the decision API.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  expect((await (await request.get(`${api}/move-requests/${approveId}`)).json()).data.status).toBe('UNDER_REVIEW');
  let approvals = 0;
  page.on('request', (req) => { if (req.method() === 'POST' && req.url().endsWith(`/${approveId}/approve`)) approvals++; });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
  expect(approvals).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
  await page.getByLabel('Completion comment (optional)').fill('Move finished without issues.');
  await page.getByRole('button', { name: 'Mark completed', exact: true }).click();
  await expectNotice(page, 'Request marked completed.');
  await expect(page.getByRole('region', { name: 'Audit log', exact: true })).toContainText('Move request completed');
  await expect(page.getByRole('region', { name: 'Status history', exact: true })).toContainText('Completed');
  await page.getByRole('link', { name: 'Back to admin dashboard', exact: false }).click();
  await expect(page.getByLabel('Filter by status')).toHaveValue('SUBMITTED');
  await expect(page.getByLabel('Filter by type')).toHaveValue('MOVE_IN');
  await expect(list.getByRole('link', { name: 'View Ananya Rao move in request' })).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('document rejection, reasons, changes, resubmission and manual rejection after AI failure', async ({ page, request }) => {
  await page.goto(reviewUrl(changesId));
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Request changes', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expect(page.locator('#decision-error')).toContainText('Enter a reason');
  await page.getByRole('button', { name: 'Reject document', exact: true }).click();
  await page.getByLabel('Document rejection reason').fill('Document is unclear.');
  await page.getByRole('button', { name: 'Save document rejection', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Document review', exact: true })).toContainText('Rejected');
  await page.getByLabel('Review documents status', { exact: true }).selectOption('NOT_APPLICABLE');
  await page.getByRole('button', { name: 'Save Review documents status', exact: true }).click();
  await expectNotice(page, 'Checklist item updated.');
  await page.getByLabel('Review documents status', { exact: true }).selectOption('PENDING');
  await page.getByRole('button', { name: 'Save Review documents status', exact: true }).click();
  await expectNotice(page, 'Checklist item updated.');
  await page.getByLabel('Decision comment / reason').fill('Please replace the unclear identity document.');
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expectNotice(page, 'Changes requested.');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  const residentView = await (await request.get(`${api}/move-requests/${changesId}`)).json();
  const replaced = await request.patch(`${api}/move-requests/${changesId}/documents/${residentView.data.documents[0].id}`, { data: { fileUrl: 'https://example.test/clear.pdf' } });
  expect(replaced.status()).toBe(200);
  expect((await request.post(`${api}/move-requests/${changesId}/submit`)).status()).toBe(200);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start review', exact: true })).toBeVisible();

  await page.goto(reviewUrl(rejectId));
  const emptyDocuments = page.getByRole('region', { name: 'Document review', exact: true });
  await expect(emptyDocuments).toContainText('No supporting documents were provided.');
  await expect(emptyDocuments.getByText('No supporting documents were provided.')).not.toHaveClass(/error/);
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run AI assessment', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Run AI assessment', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'AI assessment is temporarily unavailable' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reject', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(page.locator('#decision-error')).toContainText('Enter a reason');
  await page.getByLabel('Decision comment / reason').fill('Community requirements are not satisfied.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await expectNotice(page, 'Request rejected.');
  await expect(page.getByRole('region', { name: 'Comments', exact: true })).toContainText('Community requirements are not satisfied.');
});

test('mobile layout, cross-community errors and duplicate-action protection', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const created = await request.post(`${api}/move-requests`, { data: { residentId, type: 'MOVE_OUT' } });
  const id = (await created.json()).data.id;
  await request.patch(`${api}/move-requests/${id}`, { data: { requestedDate: '2026-09-07', requestedTimeSlot: '09:00-12:00', vehicleCount: 1 } });
  await request.post(`${api}/move-requests/${id}/documents`, { data: { documentType: 'IDENTITY_DOCUMENT', fileUrl: 'https://example.test/id.pdf' } });
  expect((await request.post(`${api}/move-requests/${id}/submit`)).status()).toBe(200);
  await page.goto(reviewUrl(id));
  await expect(page.getByRole('button', { name: 'Start review', exact: true })).toBeEnabled();
  let starts = 0;
  page.on('request', (req) => { if (req.method() === 'POST' && req.url().endsWith(`/${id}/review`)) starts++; });
  // Dispatch two clicks in one browser turn to exercise the synchronous write lock.
  await page.getByRole('button', { name: 'Start review', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled();
  expect(starts).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/admin-mobile.png', fullPage: true });
  // A stale review page must reconcile a status change, not overwrite it.
  expect((await request.post(`${api}/admin/move-requests/${id}/approve`, { data: { adminId } })).status()).toBe(200);
  await page.getByLabel('Decision comment / reason').fill('Stale request changes');
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Cannot change status');
  await expect(page.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
  await loginAs(page, 'vikram.shah@marina-residence.example.test');
  await page.goto(`/admin/${process.env.E2E_OUTSIDE_ADMIN_ID}/move-requests/${id}`);
  await expect(page.getByRole('alert')).toContainText('community');
  await expect(page.getByRole('heading', { name: 'Resident & unit', exact: true })).toHaveCount(0);
  await loginAs(page, 'meera.desai@green-heights.example.test');
  await page.goto(`/admin/${adminId}/move-requests/00000000-0000-4000-8000-000000000001`);
  await expect(page.getByRole('alert')).toContainText('not found');
});

test('optional panel failures leave authorized manual review usable', async ({ page }) => {
  for (const endpoint of ['audit-logs', 'agent-summary', 'agent-assessment']) {
    await page.route(`**/api/admin/move-requests/*/${endpoint}?*`, (route) => route.fulfill({ status: 503,
      json: { success: false, errors: [{ field: endpoint, message: 'Temporarily unavailable. Please retry.' }] } }));
  }
  await page.goto(reviewUrl(changesId));
  await expect(page.getByRole('heading', { name: 'Resident & unit', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start review', exact: true })).toBeEnabled();
  await expect(page.getByRole('region', { name: 'Audit log', exact: true })).toContainText('Temporarily unavailable');
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expectNotice(page, 'Review started.');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled();
});

test('configuration editing is community scoped and updates resident validation', async ({ page, request }) => {
  const url = `/admin/${adminId}/community/${communityId}/workflow-config`;
  const configPath = `${api}/communities/${communityId}/workflow-config/MOVE_OUT`;
  const original = (await (await request.get(configPath)).json()).data;
  const { requiredFields, requiredDocuments, allowedDays, allowedTimeSlots, instructions } = original;
  try {
    await page.goto(url);
    const moveOut = page.getByRole('region', { name: 'Move out configuration', exact: true });
    await expect(moveOut.getByLabel('Saturday', { exact: true })).toBeChecked();
    await moveOut.getByLabel('Notes', { exact: true }).check();
    await moveOut.getByLabel('Required document types (one per line)').fill('IDENTITY_DOCUMENT\nLIFT_BOOKING');
    await moveOut.getByLabel('Instructions', { exact: true }).fill('Book the service lift before moving.');
    await moveOut.getByRole('button', { name: 'Save configuration' }).click();
    await expect(moveOut.getByRole('status')).toContainText('Configuration saved.');
    const saved = (await (await request.get(configPath)).json()).data;
    expect(saved.requiredFields).toContain('notes');
    expect(saved.requiredDocuments).toEqual(['IDENTITY_DOCUMENT', 'LIFT_BOOKING']);
    const created = (await (await request.post(`${api}/move-requests`, { data: { residentId, type: 'MOVE_OUT' } })).json()).data;
    await loginAs(page, 'ananya.rao@green-heights.example.test');
    await page.goto(`/resident/${residentId}/move-requests/${created.id}`);
    await expect(page.getByLabel('Notes *', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Required documents', { exact: true })).toContainText('Lift booking');
    await loginAs(page, 'vikram.shah@marina-residence.example.test');
    await page.goto(`/admin/${process.env.E2E_OUTSIDE_ADMIN_ID}/community/${communityId}/workflow-config`);
    await expect(page).toHaveURL(`/admin/${process.env.E2E_OUTSIDE_ADMIN_ID}/community/${process.env.E2E_OUTSIDE_COMMUNITY_ID}`);
    expect((await request.put(`${api}/admin/communities/${communityId}/workflow-config/MOVE_OUT`, {
      data: { adminId: process.env.E2E_OUTSIDE_ADMIN_ID, requiredFields, requiredDocuments, allowedDays, allowedTimeSlots, instructions: 'Unauthorized change' },
    })).status()).toBe(403);
    expect((await (await request.get(configPath)).json()).data.instructions).toBe('Book the service lift before moving.');
    await page.goto(`/admin/${process.env.E2E_OUTSIDE_ADMIN_ID}/community/${process.env.E2E_OUTSIDE_COMMUNITY_ID}/workflow-config`);
    const marina = page.getByRole('region', { name: 'Move out configuration', exact: true });
    await expect(marina.getByLabel('Saturday', { exact: true })).not.toBeChecked();
    await expect(marina.getByLabel('Required document types (one per line)')).toHaveValue('');
    await expect(marina.getByLabel('Start 1', { exact: true })).toHaveValue('08:00');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/admin-config-mobile.png', fullPage: true });
  } finally {
    expect((await request.put(`${api}/admin/communities/${communityId}/workflow-config/MOVE_OUT`, {
      data: { adminId, requiredFields, requiredDocuments, allowedDays, allowedTimeSlots, instructions },
    })).status()).toBe(200);
  }
});
