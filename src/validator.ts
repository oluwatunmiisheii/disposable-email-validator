import { DEFAULT_BLOCKED_DOMAINS } from "./data/disposable-domains";
import type {
	Config,
	KnownEnvironment,
	Rules,
	ValidationResult,
} from "./types";

export class DisposableEmailValidator {
	private rules: Rules;
	private disposableDomains: Set<string>;
	private trustedDomains: Set<string> | null;

	constructor(environment: KnownEnvironment | string, config: Config) {
		const envConfig = config[environment];

		if (!envConfig) {
			throw new Error(`Invalid environment: ${environment}`);
		}

		this.rules = envConfig.rules;
		this.disposableDomains = new Set(
			(envConfig.disposableDomains ?? Array.from(DEFAULT_BLOCKED_DOMAINS)).map(
				(d) => d.toLowerCase(),
			),
		);
		this.trustedDomains = envConfig.trustedDomains
			? new Set(envConfig.trustedDomains.map((a) => a.toLowerCase()))
			: null;
	}

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
