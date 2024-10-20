export const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'My Fingerprint',
  description: 'Custom your browser fingerprint',
  // description: '__MSG_extension_description__',
  version: '2.2.2',
  permissions: [
    'storage', 
    'tabs', 
    'activeTab', 
    'webNavigation', 
    'scripting',
    'declarativeNetRequest',
  ],
  host_permissions: [
    '<all_urls>',
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
      matches: ["<all_urls>"],
      js: ["src/scripts/content.ts"],
      run_at: "document_start",
      match_about_blank: true,
      // all_frames: true,
    },
  ],
  web_accessible_resources:[]
}
export default manifest