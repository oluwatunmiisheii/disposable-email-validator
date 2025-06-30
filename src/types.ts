export const KNOWN_ENVIRONMENTS = [
	"development",
	"production",
	"staging",
	"test",
] as const;
export type KnownEnvironment = (typeof KNOWN_ENVIRONMENTS)[number];

export interface Rules {
	allow_plus_addressing: boolean;
	allow_disposable_emails: boolean;
}

export interface ConfigEnv {
	rules: Rules;
	disposableDomains?: string[];
	trustedDomains?: string[];
}

export interface Config {
	[env: KnownEnvironment | string]: ConfigEnv;
}

export interface ValidationResultSuccess {
	success: true;
	error: null;
}

export interface ValidationResultError {
	success: false;
	error: string;
}

export type ValidationResult = ValidationResultSuccess | ValidationResultError;
