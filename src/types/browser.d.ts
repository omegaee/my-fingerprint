/* TrustedScriptURL */
interface TrustedScriptURL {
  toString(): string;
}

declare var TrustedScriptURL: {
  prototype: TrustedScriptURL;
  new(): TrustedScriptURL;
} | undefined;

/* TrustedTypePolicy */
interface TrustedTypePolicy {
  createScriptURL(url: string): TrustedScriptURL;
}

declare var TrustedTypePolicy: {
  prototype: TrustedTypePolicy;
  new(name: string, policy: string): TrustedTypePolicy;
} | undefined