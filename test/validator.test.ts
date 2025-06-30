import { beforeEach, describe, expect, it } from "vitest";
import type { Config } from "../src/types";
import { DisposableEmailValidator } from "../src/validator";

describe(`${DisposableEmailValidator.name}`, () => {
	let config: Config;

	beforeEach(() => {
		config = {
			test: {
				rules: {
					allow_disposable_emails: false,
					allow_plus_addressing: true,
				},
				disposableDomains: [
					"tempmail.org",
					"10minutemail.com",
					"guerrillamail.com",
				],
				trustedDomains: ["company.com", "trusted.com"],
			},
			development: {
				rules: {
					allow_disposable_emails: true,
					allow_plus_addressing: true,
				},
			},
			production: {
				rules: {
					allow_disposable_emails: false,
					allow_plus_addressing: false,
				},
			},
		};
	});

	describe("Constructor", () => {
		it("should create validator with valid environment", () => {
			const validator = new DisposableEmailValidator("test", config);
			expect(validator).toBeInstanceOf(DisposableEmailValidator);
		});

		it("should use default blocked domains when disposableDomains not provided", () => {
			const validator = new DisposableEmailValidator("development", config);
			const result = validator.validateEmail("test@10minutemail.com");

			expect(result.success).toBe(true);
		});

		it("should throw error for invalid environment", () => {
			expect(() => {
				new DisposableEmailValidator("invalid-environment", config);
			}).toThrow("Invalid environment: invalid-environment");
		});
	});

	describe("Basic Email Format Validation", () => {
		let validator: DisposableEmailValidator;

		beforeEach(() => {
			validator = new DisposableEmailValidator("test", config);
		});

		it("should reject emails without @", () => {
			const result = validator.validateEmail("invalid-email");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should reject emails without local part", () => {
			const result = validator.validateEmail("@domain.com");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should reject emails without domain", () => {
			const result = validator.validateEmail("user@");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should accept valid email format", () => {
			const result = validator.validateEmail("user@gmail.com");
			expect(result.success).toBe(true);
		});

		it("should handle emails with multiple @ symbols correctly", () => {
			const result = validator.validateEmail("user@domain@com");
			// Should use lastIndexOf('@') so domain becomes 'com'
			expect(result.success).toBe(true);
		});

		it("should trim whitespace and convert to lowercase", () => {
			const result = validator.validateEmail("  USER@GMAIL.COM  ");
			expect(result.success).toBe(true);
		});
	});

	describe("Trusted Domains (Allowlist)", () => {
		let validator: DisposableEmailValidator;

		beforeEach(() => {
			validator = new DisposableEmailValidator("test", config);
		});

		it("should allow specific trusted email addresses", () => {
			const result = validator.validateEmail("admin@company.com");
			expect(result.success).toBe(true);
		});

		it("should allow all emails from trusted domains", () => {
			const result = validator.validateEmail("anyone@trusted.com");
			expect(result.success).toBe(true);
		});

		it("should allow trusted emails even if they would normally be blocked", () => {
			const customConfig = {
				test: {
					...config.test,
					trustedDomains: ["tempmail.org", "admin@company.com"],
				},
			};
			const customValidator = new DisposableEmailValidator(
				"test",
				customConfig,
			);

			const result = customValidator.validateEmail("user@tempmail.org");
			expect(result.success).toBe(true);
		});

		it("should be case insensitive for trusted domains", () => {
			const result = validator.validateEmail("ADMIN@COMPANY.COM");
			expect(result.success).toBe(true);
		});
	});

	describe("Disposable Email Blocking", () => {
		let validator: DisposableEmailValidator;

		beforeEach(() => {
			validator = new DisposableEmailValidator("test", config);
		});

		it("should block disposable email domains", () => {
			const result = validator.validateEmail("user@tempmail.org");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Disposable email addresses are not allowed");
		});

		it("should allow disposable emails when allow_disposable_emails is true", () => {
			const validator = new DisposableEmailValidator("development", config);
			const result = validator.validateEmail("user@tempmail.org");
			expect(result.success).toBe(true);
		});

		it("should be case insensitive for disposable domains", () => {
			const result = validator.validateEmail("user@TEMPMAIL.ORG");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Disposable email addresses are not allowed");
		});

		it("should block multiple known disposable domains", () => {
			const domains = ["tempmail.org", "10minutemail.com", "guerrillamail.com"];

			for (const domain of domains) {
				const result = validator.validateEmail(`user@${domain}`);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Disposable email addresses are not allowed");
			}
		});
	});

	describe("Plus Addressing Validation", () => {
		let validator: DisposableEmailValidator;

		beforeEach(() => {
			validator = new DisposableEmailValidator("test", config);
		});

		it("should allow plus addressing when allow_plus_addressing is true", () => {
			const result = validator.validateEmail("user+newsletter@gmail.com");
			expect(result.success).toBe(true);
		});

		it("should block plus addressing when allow_plus_addressing is false", () => {
			const validator = new DisposableEmailValidator("production", config);
			const result = validator.validateEmail("user+tag@gmail.com");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Plus addressing is not allowed");
		});

		it("should handle multiple plus signs in local part", () => {
			const validator = new DisposableEmailValidator("production", config);
			const result = validator.validateEmail("user+tag+more@gmail.com");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Plus addressing is not allowed");
		});

		it("should not affect plus signs in domain (though invalid)", () => {
			const result = validator.validateEmail("user@gmail+test.com");
			expect(result.success).toBe(true);
		});
	});

	describe("Environment-based Configuration", () => {
		it("should apply development environment rules", () => {
			const validator = new DisposableEmailValidator("development", config);

			const disposableResult = validator.validateEmail("user@tempmail.org");
			expect(disposableResult.success).toBe(true);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(true);
		});

		it("should apply production environment rules", () => {
			const validator = new DisposableEmailValidator("production", config);

			const disposableResult = validator.validateEmail(
				"cigen88224@boxmach.com",
			);
			expect(disposableResult.success).toBe(false);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(false);
		});

		it("should apply test environment rules", () => {
			const validator = new DisposableEmailValidator("test", config);

			const disposableResult = validator.validateEmail("user@tempmail.org");
			expect(disposableResult.success).toBe(false);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(true);
		});
	});

	describe("Validation Priority Order", () => {
		let validator: DisposableEmailValidator;

		beforeEach(() => {
			validator = new DisposableEmailValidator("test", config);
		});

		it("should validate format before checking trusted domains", () => {
			const result = validator.validateEmail("invalid-email");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should check trusted domains before disposable domains", () => {
			const customConfig = {
				test: {
					...config.test,
					trustedDomains: ["tempmail.org"],
				},
			};
			const customValidator = new DisposableEmailValidator(
				"test",
				customConfig,
			);

			const result = customValidator.validateEmail("user@tempmail.org");
			expect(result.success).toBe(true);
		});

		it("should check disposable domains before plus addressing", () => {
			const validator = new DisposableEmailValidator("production", config);
			const result = validator.validateEmail("user+tag@tempmail.org");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Plus addressing is not allowed");
		});
	});

	describe("Edge Cases", () => {
		let validator: DisposableEmailValidator;

		beforeEach(() => {
			validator = new DisposableEmailValidator("test", config);
		});

		it("should handle empty string", () => {
			const result = validator.validateEmail("");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should handle very long emails", () => {
			const longLocal = "a".repeat(64);
			const longDomain = `${"b".repeat(60)}.com`;
			const result = validator.validateEmail(`${longLocal}@${longDomain}`);
			expect(result.success).toBe(true);
		});

		it("should handle international domains", () => {
			const result = validator.validateEmail("user@münchen.de");
			expect(result.success).toBe(true);
		});

		it("should handle emails with dots in local part", () => {
			const result = validator.validateEmail("first.last@gmail.com");
			expect(result.success).toBe(true);
		});

		it("should handle subdomains", () => {
			const result = validator.validateEmail("user@mail.company.com");
			expect(result.success).toBe(true);
		});
	});

	describe("No Configuration Provided", () => {
		it("should use default blocked domains when disposableDomains is undefined", () => {
			const minimalConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
				},
			};

			const validator = new DisposableEmailValidator("test", minimalConfig);

			const result = validator.validateEmail("user@10minutemail.com");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Disposable email addresses are not allowed");
		});

		it("should work without trusted domains", () => {
			const minimalConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
				},
			};

			const validator = new DisposableEmailValidator("test", minimalConfig);
			const result = validator.validateEmail("user@gmail.com");
			expect(result.success).toBe(true);
		});
	});
});
