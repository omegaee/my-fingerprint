import { ManifestV3Export } from "@crxjs/vite-plugin"

const baseManifest: ManifestV3Export = {
  manifest_version: 3,
  version: '2.6.3.1',
  name: 'My Fingerprint',
  default_locale: 'en',
  description: '__MSG_ext_desc__',
  host_permissions: [
    '<all_urls>',
  ],
  icons: {
    128: 'logo.png',
  },
  action: {
    default_popup: "src/popup/index.html",
  },
  web_accessible_resources: []
}

const VALUES = {
  permissions: [
    'storage',
    'tabs',
    'activeTab',
    'webNavigation',
    'scripting',
    'declarativeNetRequest',
    'clipboardRead',
    'clipboardWrite',
  ] as chrome.runtime.ManifestPermissions[],
  optional_permissions: [
    "userScripts",
  ] as chrome.runtime.ManifestPermissions[],
  background: "src/background/index.ts",
  content: {
    matches: ["<all_urls>"],
    js: ["src/scripts/content.ts"],
    run_at: "document_start",
    match_about_blank: true,
    // all_frames: true,
  },
}

export const chromeManifest: ManifestV3Export = {
  ...baseManifest,
  minimum_chrome_version: '102',
  key: "b21lZ2FlZS9teS1maW5nZXJwcmludAo=",
  update_url: 'https://raw.githubusercontent.com/omegaee/my-fingerprint/refs/heads/main/updates.xml',
  permissions: [
    ...VALUES.permissions,
    ...VALUES.optional_permissions,
  ],
  background: {
    service_worker: VALUES.background,
  },
  content_scripts: [
    {
      // @ts-ignore
      world: "ISOLATED",
      ...VALUES.content,
    },
  ],
}

export const firefoxManifest: ManifestV3Export & { [key: string]: any } = {
  ...baseManifest,
  browser_specific_settings: {
    gecko: {
      id: "my-fingerprint@omegaee.addons",
      strict_min_version: "136.0"
    }
  },
  permissions: VALUES.permissions,
  optional_permissions: VALUES.optional_permissions,
  background: {
    scripts: [VALUES.background],
  },
  content_scripts: [
    VALUES.content,
  ],
}