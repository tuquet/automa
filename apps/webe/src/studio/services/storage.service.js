/**
 * Storage & API Service for Automa Standalone Studio
 * 100% Typed consumption from @automa/types/api.
 * Zero Fallback Invariant: Pure API passthrough without local IndexedDB caching.
 */

import {
  getStorageTables as apiGetStorageTables,
  addStorageTable as apiAddStorageTable,
  deleteStorageTable as apiDeleteStorageTable,
  getStorageTableRows as apiGetStorageTableRows,
  addStorageTableRow as apiAddStorageTableRow,
  getStorageVariables as apiGetStorageVariables,
  addStorageVariable as apiAddStorageVariable,
  deleteStorageVariable as apiDeleteStorageVariable,
  getStorageCredentials as apiGetStorageCredentials,
  addStorageCredential as apiAddStorageCredential,
  deleteStorageCredential as apiDeleteStorageCredential,
  getStorageWorkflows as apiGetStorageWorkflows,
  getStorageWorkflow as apiGetStorageWorkflow,
  createStorageWorkflow as apiCreateStorageWorkflow,
  updateStorageWorkflow as apiUpdateStorageWorkflow,
  deleteStorageWorkflow as apiDeleteStorageWorkflow,
  getBrowsers as apiGetBrowsers,
  createBrowser as apiCreateBrowser,
  deleteBrowser as apiDeleteBrowser,
  killAllBrowsers as apiKillAllBrowsers,
  startBrowser as apiStartBrowserSession,
  stopBrowserSession as apiStopBrowserSession,
  getSystemMetrics as apiGetSystemMetrics,
  getAppSettings as apiGetAppSettings,
  updateAppSettings as apiUpdateAppSettings,
  patchAppSettings as apiPatchAppSettings,
  encryptSecret as apiEncryptSecret,
  getStorageCampaigns as apiGetStorageCampaigns,
  executeCampaign as apiExecuteCampaign,
  abortCampaign as apiAbortCampaign,
  installBrowserBinary as apiInstallBrowserBinary,
  getActiveJobs as apiGetActiveJobs,
  killJob as apiKillJob,
} from '@automa/types/api';

export function getDaemonBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname;
    if (host === '127.0.0.1' || host === 'localhost') {
      return window.location.origin.replace(/\/$/, '');
    }
  }
  return 'http://127.0.0.1:8765';
}

export const DAEMON_BASE_URL = getDaemonBaseUrl();

export function formatApiError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err.trim() || 'Unknown error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    if (err.message) return err.message;
    if (err.error) return err.error;
    if (err.detail) return err.detail;
    try {
      return JSON.stringify(err);
    } catch (_) {
      return String(err);
    }
  }
  return String(err);
}

// --------------------------------------------------------------------------
// 1. Storage Tables Service (SQLite Database-First)
// --------------------------------------------------------------------------

export async function fetchStorageTables() {
  const res = await apiGetStorageTables({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return (
    res.data?.map((t) => ({
      id: t.id,
      name: t.name || 'Untitled Table',
      createdAt: t.createdAt || t.created_at || Date.now(),
      modifiedAt: t.modifiedAt || t.modified_at || Date.now(),
      columns: t.columns || [],
    })) || []
  );
}

export async function createStorageTable(tableData) {
  const payload = {
    name: tableData.name || 'New Table',
    columns: tableData.columns || [],
  };

  const res = await apiAddStorageTable({
    baseUrl: DAEMON_BASE_URL,
    body: payload,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function deleteStorageTable(tableId) {
  const res = await apiDeleteStorageTable({
    baseUrl: DAEMON_BASE_URL,
    path: { id: tableId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
}

export async function fetchStorageTableRows(tableId) {
  const res = await apiGetStorageTableRows({
    baseUrl: DAEMON_BASE_URL,
    path: { id: tableId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data || [];
}

export async function addStorageTableRow(tableId, rowData) {
  const res = await apiAddStorageTableRow({
    baseUrl: DAEMON_BASE_URL,
    path: { id: tableId },
    body: rowData,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

// --------------------------------------------------------------------------
// 2. Storage Variables Service
// --------------------------------------------------------------------------

export async function fetchStorageVariables() {
  const res = await apiGetStorageVariables({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return (
    res.data?.map((v) => ({
      id: v.id || v.name || v.key,
      name: v.name || v.key || '',
      value: v.value ?? '',
    })) || []
  );
}

export async function createStorageVariable(varData) {
  const payload = {
    name: varData.name || varData.key,
    key: varData.key || varData.name,
    value: varData.value ?? '',
  };

  const res = await apiAddStorageVariable({
    baseUrl: DAEMON_BASE_URL,
    body: payload,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function deleteStorageVariable(varId) {
  const res = await apiDeleteStorageVariable({
    baseUrl: DAEMON_BASE_URL,
    path: { id: varId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
}

// --------------------------------------------------------------------------
// 3. Storage Credentials & AES Secrets Service
// --------------------------------------------------------------------------

export async function fetchStorageCredentials() {
  const res = await apiGetStorageCredentials({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data || [];
}

export async function createStorageCredential(credData) {
  const res = await apiAddStorageCredential({
    baseUrl: DAEMON_BASE_URL,
    body: {
      name: credData.name,
      value: credData.value,
      description: credData.description || '',
    },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function deleteStorageCredential(name) {
  const res = await apiDeleteStorageCredential({
    baseUrl: DAEMON_BASE_URL,
    path: { id: name },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function encryptSecretText(secret, passphrase) {
  const res = await apiEncryptSecret({
    baseUrl: DAEMON_BASE_URL,
    body: { secret, passphrase },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

// --------------------------------------------------------------------------
// 4. Browsers Fleet Service
// --------------------------------------------------------------------------

export async function fetchBrowsers() {
  const res = await apiGetBrowsers({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data || [];
}

export async function createBrowserProfile(profileData) {
  const res = await apiCreateBrowser({
    baseUrl: DAEMON_BASE_URL,
    body: profileData,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function deleteBrowserProfile(browserId) {
  const res = await apiDeleteBrowser({
    baseUrl: DAEMON_BASE_URL,
    path: { id: browserId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function launchBrowserSession(browserId) {
  const res = await apiStartBrowserSession({
    baseUrl: DAEMON_BASE_URL,
    path: { id: browserId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function closeBrowserSession(browserId) {
  const res = await apiStopBrowserSession({
    baseUrl: DAEMON_BASE_URL,
    path: { id: browserId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function killAllBrowserProcesses() {
  const res = await apiKillAllBrowsers({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function downloadChromiumBinary() {
  const res = await apiInstallBrowserBinary({
    baseUrl: DAEMON_BASE_URL,
    body: { browser: 'chromium' },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function setDefaultBrowserProfile(profileId) {
  const res = await apiPatchAppSettings({
    baseUrl: DAEMON_BASE_URL,
    body: {
      browser: { default_profile_id: profileId },
    },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function fetchSystemMetrics() {
  const res = await apiGetSystemMetrics({ baseUrl: DAEMON_BASE_URL });
  return res.data || null;
}

export async function fetchAppSettings() {
  const res = await apiGetAppSettings({ baseUrl: DAEMON_BASE_URL });
  return res.data || null;
}

export async function getDefaultBrowserProfile() {
  const settings = await fetchAppSettings();
  return settings?.browser?.default_profile_id || null;
}

export async function saveAppSettings(settings) {
  const res = await apiUpdateAppSettings({
    baseUrl: DAEMON_BASE_URL,
    body: settings,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function patchGridMatrixSettings(gridConfig) {
  const res = await apiPatchAppSettings({
    baseUrl: DAEMON_BASE_URL,
    body: { grid: gridConfig },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

// --------------------------------------------------------------------------
// 6. Active Jobs & Campaigns Service
// --------------------------------------------------------------------------

export async function fetchActiveJobs() {
  const res = await apiGetActiveJobs({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data || [];
}

export async function cancelJob(jobId) {
  const res = await apiKillJob({
    baseUrl: DAEMON_BASE_URL,
    path: { job_id: jobId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function fetchStorageCampaigns() {
  const res = await apiGetStorageCampaigns({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data || [];
}

export async function runCampaign(campaignId) {
  const res = await apiExecuteCampaign({
    baseUrl: DAEMON_BASE_URL,
    path: { id: campaignId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function stopCampaign(campaignId) {
  const res = await apiAbortCampaign({
    baseUrl: DAEMON_BASE_URL,
    path: { id: campaignId },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function fetchStorageWorkflows() {
  const res = await apiGetStorageWorkflows({ baseUrl: DAEMON_BASE_URL });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data || [];
}

export async function fetchStorageWorkflow(id) {
  const res = await apiGetStorageWorkflow({
    baseUrl: DAEMON_BASE_URL,
    path: { id },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function createStorageWorkflow(workflowData) {
  const res = await apiCreateStorageWorkflow({
    baseUrl: DAEMON_BASE_URL,
    body: workflowData,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function updateStorageWorkflow(id, workflowData) {
  const res = await apiUpdateStorageWorkflow({
    baseUrl: DAEMON_BASE_URL,
    path: { id },
    body: workflowData,
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function deleteStorageWorkflow(id) {
  const res = await apiDeleteStorageWorkflow({
    baseUrl: DAEMON_BASE_URL,
    path: { id },
  });
  if (res.error) throw new Error(formatApiError(res.error));
  return res.data;
}

export async function fetchStorageFiles() {
  return fetchStorageWorkflows();
}
