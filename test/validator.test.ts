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

		it("should reject emails with only @ symbol", () => {
			const result = validator.validateEmail("@");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should accept valid email format", () => {
			const result = validator.validateEmail("user@gmail.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle emails with multiple @ symbols correctly", () => {
			const result = validator.validateEmail("user@domain@com");
			// Should use lastIndexOf('@') so domain becomes 'com'
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should trim whitespace and convert to lowercase", () => {
			const result = validator.validateEmail("  USER@GMAIL.COM  ");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle emails with leading/trailing whitespace only", () => {
			const result = validator.validateEmail("   user@example.com   ");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle emails with mixed case properly", () => {
			const result = validator.validateEmail("User@Example.COM");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
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
			expect(result.error).toBe(null);
		});

		it("should allow all emails from trusted domains", () => {
			const result = validator.validateEmail("anyone@trusted.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
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
			expect(result.error).toBe(null);
		});

		it("should be case insensitive for trusted domains", () => {
			const result = validator.validateEmail("ADMIN@COMPANY.COM");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should work with empty trusted domains array", () => {
			const customConfig = {
				test: {
					...config.test,
					trustedDomains: [],
				},
			};
			const customValidator = new DisposableEmailValidator(
				"test",
				customConfig,
			);

			const result = customValidator.validateEmail("user@gmail.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle trusted domains with special characters", () => {
			const customConfig = {
				test: {
					...config.test,
					trustedDomains: ["test-domain.co.uk", "user+admin@special.com"],
				},
			};
			const customValidator = new DisposableEmailValidator(
				"test",
				customConfig,
			);

			const domainResult = customValidator.validateEmail(
				"user@test-domain.co.uk",
			);
			expect(domainResult.success).toBe(true);
			expect(domainResult.error).toBe(null);

			const emailResult = customValidator.validateEmail(
				"user+admin@special.com",
			);
			expect(emailResult.success).toBe(true);
			expect(emailResult.error).toBe(null);
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
			expect(result.error).toBe(null);
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
			expect(result.error).toBe(null);
		});

		it("should handle edge cases with plus at start or end of local part", () => {
			const prodValidator = new DisposableEmailValidator("production", config);

			const startPlusResult = prodValidator.validateEmail("+user@gmail.com");
			expect(startPlusResult.success).toBe(false);
			expect(startPlusResult.error).toBe("Plus addressing is not allowed");

			const endPlusResult = prodValidator.validateEmail("user+@gmail.com");
			expect(endPlusResult.success).toBe(false);
			expect(endPlusResult.error).toBe("Plus addressing is not allowed");
		});

		it("should handle consecutive plus signs", () => {
			const prodValidator = new DisposableEmailValidator("production", config);
			const result = prodValidator.validateEmail("user++tag@gmail.com");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Plus addressing is not allowed");
		});
	});

	describe("Environment-based Configuration", () => {
		it("should apply development environment rules", () => {
			const validator = new DisposableEmailValidator("development", config);

			const disposableResult = validator.validateEmail("user@tempmail.org");
			expect(disposableResult.success).toBe(true);
			expect(disposableResult.error).toBe(null);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(true);
			expect(plusResult.error).toBe(null);
		});

		it("should apply production environment rules", () => {
			const validator = new DisposableEmailValidator("production", config);

			const disposableResult = validator.validateEmail(
				"cigen88224@boxmach.com",
			);
			expect(disposableResult.success).toBe(false);
			expect(disposableResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(false);
			expect(plusResult.error).toBe("Plus addressing is not allowed");
		});

		it("should apply test environment rules", () => {
			const validator = new DisposableEmailValidator("test", config);

			const disposableResult = validator.validateEmail("user@tempmail.org");
			expect(disposableResult.success).toBe(false);
			expect(disposableResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(true);
			expect(plusResult.error).toBe(null);
		});

		it("should handle custom environment names", () => {
			const customConfig = {
				"my-custom-env": {
					rules: {
						allow_disposable_emails: true,
						allow_plus_addressing: false,
					},
				},
			};

			const validator = new DisposableEmailValidator(
				"my-custom-env",
				customConfig,
			);

			const disposableResult = validator.validateEmail("user@tempmail.org");
			expect(disposableResult.success).toBe(true);
			expect(disposableResult.error).toBe(null);

			const plusResult = validator.validateEmail("user+tag@gmail.com");
			expect(plusResult.success).toBe(false);
			expect(plusResult.error).toBe("Plus addressing is not allowed");
		});

		it("should handle environments with special characters in names", () => {
			const customConfig = {
				"test-env_123": {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
				},
			};

			const validator = new DisposableEmailValidator(
				"test-env_123",
				customConfig,
			);
			const result = validator.validateEmail("user@gmail.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
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

		it("should handle whitespace-only string", () => {
			const result = validator.validateEmail("   ");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should handle very long emails", () => {
			const longLocal = "a".repeat(64);
			const longDomain = `${"b".repeat(60)}.com`;
			const result = validator.validateEmail(`${longLocal}@${longDomain}`);
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle international domains", () => {
			const result = validator.validateEmail("user@münchen.de");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle emails with dots in local part", () => {
			const result = validator.validateEmail("first.last@gmail.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle subdomains", () => {
			const result = validator.validateEmail("user@mail.company.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle numeric domains", () => {
			const result = validator.validateEmail("user@123.456.789.012");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle emails with special characters in local part", () => {
			const result = validator.validateEmail("user-name_123@example.com");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle single character local and domain parts", () => {
			const result = validator.validateEmail("a@b.c");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
		});

		it("should handle emails with numbers only", () => {
			const result = validator.validateEmail("123@456.789");
			expect(result.success).toBe(true);
			expect(result.error).toBe(null);
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

	describe("Merge Disposable Domains", () => {
		it("should merge custom domains with built-in list by default", () => {
			const customConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
					disposableDomains: ["custom-disposable.com"],
				},
			};

			const validator = new DisposableEmailValidator("test", customConfig);

			const customResult = validator.validateEmail(
				"user@custom-disposable.com",
			);
			expect(customResult.success).toBe(false);
			expect(customResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const builtInResult = validator.validateEmail("user@10minutemail.com");
			expect(builtInResult.success).toBe(false);
			expect(builtInResult.error).toBe(
				"Disposable email addresses are not allowed",
			);
		});

		it("should merge custom domains with built-in list when mergeDisposableDomains is true", () => {
			const customConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
					disposableDomains: ["custom-disposable.com"],
					mergeDisposableDomains: true,
				},
			};

			const validator = new DisposableEmailValidator("test", customConfig);

			const customResult = validator.validateEmail(
				"user@custom-disposable.com",
			);
			expect(customResult.success).toBe(false);
			expect(customResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const builtInResult = validator.validateEmail("user@10minutemail.com");
			expect(builtInResult.success).toBe(false);
			expect(builtInResult.error).toBe(
				"Disposable email addresses are not allowed",
			);
		});

		it("should use only custom domains when mergeDisposableDomains is false", () => {
			const customConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
					disposableDomains: ["custom-disposable.com"],
					mergeDisposableDomains: false,
				},
			};

			const validator = new DisposableEmailValidator("test", customConfig);

			const customResult = validator.validateEmail(
				"user@custom-disposable.com",
			);
			expect(customResult.success).toBe(false);
			expect(customResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const builtInResult = validator.validateEmail("user@10minutemail.com");
			expect(builtInResult.success).toBe(true);
		});

		it("should handle environment-specific merging behavior", () => {
			const customConfig = {
				staging: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
					disposableDomains: ["staging-temp.com"],
					mergeDisposableDomains: true,
				},
				production: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: false,
					},
					disposableDomains: ["prod-only.com"],
					mergeDisposableDomains: false,
				},
			};

			const stagingValidator = new DisposableEmailValidator(
				"staging",
				customConfig,
			);
			const prodValidator = new DisposableEmailValidator(
				"production",
				customConfig,
			);

			const stagingCustomResult = stagingValidator.validateEmail(
				"user@staging-temp.com",
			);
			expect(stagingCustomResult.success).toBe(false);
			expect(stagingCustomResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const stagingBuiltInResult = stagingValidator.validateEmail(
				"user@10minutemail.com",
			);
			expect(stagingBuiltInResult.success).toBe(false);
			expect(stagingBuiltInResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const prodCustomResult =
				prodValidator.validateEmail("user@prod-only.com");
			expect(prodCustomResult.success).toBe(false);
			expect(prodCustomResult.error).toBe(
				"Disposable email addresses are not allowed",
			);

			const prodBuiltInResult = prodValidator.validateEmail(
				"user@10minutemail.com",
			);
			expect(prodBuiltInResult.success).toBe(true);
			expect(prodBuiltInResult.error).toBe(null);
		});

		it("should handle duplicate domains in custom list", () => {
			const customConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
					disposableDomains: ["custom.com", "custom.com", "another.com"],
					mergeDisposableDomains: true,
				},
			};

			const validator = new DisposableEmailValidator("test", customConfig);
			const result = validator.validateEmail("user@custom.com");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Disposable email addresses are not allowed");
		});

		it("should handle empty custom disposable domains array", () => {
			const customConfig = {
				test: {
					rules: {
						allow_disposable_emails: false,
						allow_plus_addressing: true,
					},
					disposableDomains: [],
					mergeDisposableDomains: false,
				},
			};

			const validator = new DisposableEmailValidator("test", customConfig);

			const builtInResult = validator.validateEmail("user@10minutemail.com");
			expect(builtInResult.success).toBe(true);
			expect(builtInResult.error).toBe(null);
		});
	});
});
