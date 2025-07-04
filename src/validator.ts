import { DEFAULT_BLOCKED_DOMAINS } from "./data/disposable-domains";
import type {
	Config,
	KnownEnvironment,
	Rules,
	ValidationResult,
} from "./types";

/**
 * A configurable email validator that blocks disposable email addresses and validates plus addressing
 * based on environment-specific rules.
 *
 * @example
 * ```typescript
 * const config = {
 *   production: {
 *     rules: {
 *       allow_disposable_emails: false,
 *       allow_plus_addressing: false
 *     },
 *     disposableDomains: ['custom-temp.com'],
 *     trustedDomains: ['company.com']
 *   }
 * };
 *
 * const validator = new DisposableEmailValidator('production', config);
 * const result = validator.validateEmail('user@example.com');
 *
 * if (result.success) {
 *   console.log('Email is valid');
 * } else {
 *   console.log('Validation failed:', result.error);
 * }
 * ```
 */
export class DisposableEmailValidator {
	private rules: Rules;
	private disposableDomains: Set<string>;
	private trustedDomains: Set<string> | null;

	/**
	 * Creates a new DisposableEmailValidator instance for the specified environment.
	 *
	 * @param environment - The environment name to use for configuration (e.g., 'production', 'development', 'test')
	 * @param config - The configuration object containing environment-specific rules and domain lists
	 *
	 * @throws {Error} Throws an error if the specified environment is not found in the config
	 *
	 * @example
	 * ```typescript
	 * const config = {
	 *   production: {
	 *     rules: {
	 *       allow_disposable_emails: false,
	 *       allow_plus_addressing: false
	 *     },
	 *     disposableDomains: ['temp-mail.org'],
	 *     trustedDomains: ['company.com'],
	 *     mergeDisposableDomains: true
	 *   }
	 * };
	 *
	 * const validator = new DisposableEmailValidator('production', config);
	 * ```
	 */
	constructor(environment: KnownEnvironment | string, config: Config) {
		const envConfig = config[environment];

		if (!envConfig) {
			throw new Error(`Invalid environment: ${environment}`);
		}

		this.rules = envConfig.rules;

		let domainsToUse: string[];
		if (envConfig.disposableDomains) {
			const shouldMerge = envConfig.mergeDisposableDomains ?? true;
			if (shouldMerge) {
				domainsToUse = [
					...Array.from(DEFAULT_BLOCKED_DOMAINS),
					...envConfig.disposableDomains,
				];
			} else {
				domainsToUse = envConfig.disposableDomains;
			}
		} else {
			domainsToUse = Array.from(DEFAULT_BLOCKED_DOMAINS);
		}

		this.disposableDomains = new Set(domainsToUse.map((d) => d.toLowerCase()));

		this.trustedDomains = envConfig.trustedDomains
			? new Set(envConfig.trustedDomains.map((a) => a.toLowerCase()))
			: null;
	}

	/**
	 * Validates an email address according to the configured rules for the current environment.
	 *
	 * The validation process follows this priority order:
	 * 1. Format validation (checks for valid email structure)
	 * 2. Trusted domains/emails check (allowlist - bypasses all other checks)
	 * 3. Disposable email domains check (if allow_disposable_emails is false)
	 * 4. Plus addressing check (if allow_plus_addressing is false)
	 *
	 * @param email - The email address to validate
	 * @returns A validation result object containing success status and error message (if any)
	 *
	 * @example
	 * ```typescript
	 * // Valid email
	 * const result1 = validator.validateEmail('user@gmail.com');
	 * // { success: true, error: null }
	 *
	 * // Invalid format
	 * const result2 = validator.validateEmail('invalid-email');
	 * // { success: false, error: 'Invalid email format' }
	 *
	 * // Disposable email (when blocked)
	 * const result3 = validator.validateEmail('user@10minutemail.com');
	 * // { success: false, error: 'Disposable email addresses are not allowed' }
	 *
	 * // Plus addressing (when blocked)
	 * const result4 = validator.validateEmail('user+tag@gmail.com');
	 * // { success: false, error: 'Plus addressing is not allowed' }
	 *
	 * // Trusted email (bypasses all checks)
	 * const result5 = validator.validateEmail('admin@trusted-domain.com');
	 * // { success: true, error: null }
	 * ```
	 */
	validateEmail(email: string): ValidationResult {
		const emailLower = email.toLowerCase().trim();
		const atIndex = emailLower.lastIndexOf("@");
		const localPart = emailLower.substring(0, atIndex);
		const domain = emailLower.substring(atIndex + 1);

		if (!localPart || !domain) {
			return { success: false, error: "Invalid email format" };
		}

		if (this.trustedDomains) {
			if (
				this.trustedDomains.has(emailLower) ||
				this.trustedDomains.has(domain)
			) {
				return { success: true, error: null };
			}
		}

		if (
			!this.rules.allow_disposable_emails &&
			this.disposableDomains.has(domain)
		) {
			return {
				success: false,
				error: "Disposable email addresses are not allowed",
			};
		}

		if (!this.rules.allow_plus_addressing && localPart.includes("+")) {
			return { success: false, error: "Plus addressing is not allowed" };
		}

		return { success: true, error: null };
	}
}
