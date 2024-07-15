export const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'My Fingerprint',
  description: 'Custom your browser fingerprint',
  // description: '__MSG_extension_description__',
  version: '2.0.0',
  permissions: [
    'storage', 
    'tabs', 
    'activeTab', 
    'webNavigation', 
    'scripting',
    // 'declarativeNetRequest',
    'declarativeNetRequestWithHostAccess',
  ],
  host_permissions: [
    "<all_urls>"
  ],
  icons: {
    128: 'logo.png',
  },
  action: {
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
  },
  content_scripts:[
    {
      world: "ISOLATED",
      // world: "MAIN",
      matches: ["<all_urls>"],
      js: ["src/scripts/content.ts"],
      match_about_blank: true,
      run_at: "document_start",
      all_frames: true,
    },
  ],
  web_accessible_resources:[]
}
export default manifest