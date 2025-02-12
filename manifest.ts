export const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  minimum_chrome_version: '88',
  default_locale: 'en',
  name: 'My Fingerprint',
  description: '__MSG_ext_desc__',
  version: '2.3.3',
  permissions: [
    'storage', 
    'tabs', 
    'activeTab', 
    'webNavigation', 
    'scripting',
    'userScripts',
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