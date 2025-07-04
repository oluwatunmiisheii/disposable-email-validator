# Disposable Email Validator

![npm](https://img.shields.io/npm/v/disposable-email-validator)
![types](https://img.shields.io/npm/types/disposable-email-validator)
![license](https://img.shields.io/npm/l/disposable-email-validator)
![tests](https://img.shields.io/badge/tests-vitest-green)

> Filter temporary/disposable email domains and normalize email addresses, with environment-specific rules.

---

## Features

- **Block disposable email addresses**
- **Optional plus addressing validation** (e.g., `user+tag@gmail.com`)
- **Allowlist support** for trusted emails/domains
- **Environment-based configuration** (use any environment names: `development`, `staging`, `production`, `my-app-env`, etc.)
- **Fully typed with TypeScript**

---

## Installation

```bash
npm install disposable-email-validator
```

---

## Quick Start

```ts
import { DisposableEmailValidator } from 'disposable-email-validator';

const config = {
  production: {
    rules: {
      allow_disposable_emails: false,
      allow_plus_addressing: false,
    }
  }
};

const validator = new DisposableEmailValidator('production', config);

const result = validator.validateEmail('user@10minutemail.com');
console.log(result);
// { success: false, error: 'Disposable email addresses are not allowed' }
```

---

## Configuration

The library uses environment-based configuration to support different validation rules across any environment you define. While `development`, `staging`, `production`, and `test` are common examples, you can use any environment names that match your setup.

### Full Example

```ts
const config = {
  development: {
    rules: {
      allow_disposable_emails: true,
      allow_plus_addressing: true
    }
  },
  production: {
    rules: {
      allow_disposable_emails: false,
      allow_plus_addressing: false
    },
    disposableDomains: ['10minutemail.com', 'tempmail.org'],
    trustedDomains: ['company.org', 'company.com'],
    mergeDisposableDomains: true
  },
  'my-custom-env': {
    rules: {
      allow_disposable_emails: true,
      allow_plus_addressing: false
    },
    disposableDomains: ['custom-temp.com'],
    mergeDisposableDomains: false
  }
};
```


## Configuration Reference

| Key                | Type        | Required | Default           | Description |
|--------------------|-------------|----------|-------------------|-------------|
| `rules.allow_disposable_emails` | `boolean` | Yes | – | Blocks disposable domains |
| `rules.allow_plus_addressing`       | `boolean` | Yes | – | Blocks plus-addressed emails |
| `disposableDomains`         | `string[]` | No | Built-in list      | Custom domains to block |
| `trustedDomains`         | `string[]` | No | `undefined`        | Emails/domains to allow regardless of rules |
| `mergeDisposableDomains`    | `boolean`  | No | `true`            | Whether to merge custom domains with built-in list |

### Custom Disposable Domains

The `mergeDisposableDomains` option controls how your custom `disposableDomains` list is handled:

- **`true` (default)**: Your custom domains are **added to** the built-in list
- **`false`**: **Only** your custom domains are used (built-in list is ignored)

```ts
// Example: Merge with built-in list (recommended)
{
  production: {
    rules: { allow_disposable_emails: false, allow_plus_addressing: false },
    disposableDomains: ['company-temp.com'],
    mergeDisposableDomains: true  // Blocks both built-in domains AND company-temp.com
  }
}

// Example: Use only custom domains
{
  production: {
    rules: { allow_disposable_emails: false, allow_plus_addressing: false },
    disposableDomains: ['company-temp.com'],
    mergeDisposableDomains: false  // Only blocks company-temp.com (allows 10minutemail.com, etc.)
  }
}
```

## API

### Constructor

```ts
new DisposableEmailValidator(environment: string, config: DisposableEmailValidatorConfig)
```

- `environment`: the name of any environment defined in your config (e.g., `production`, `development`, `staging`, `my-custom-env`, etc.)
- `config`: your full multi-environment configuration object

---

### `validateEmail(email: string): ValidationResult`

Returns:

```ts
{ success: true, error: null }
// or
{ success: false, error: string }
```

### Error Messages

- `'Invalid email format'`
- `'Disposable email addresses are not allowed'`
- `'Plus addressing is not allowed'`

---

## Default Blocked Domains

If `disposableDomains` is not provided, this package includes a prebuilt list from [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains).

You get coverage for thousands of known throwaway providers out of the box.

---

## Why Use This?

- Designed for production apps
- Prevent fake signups from temporary emails
- Multiple environments supported
- Built-in domain blacklist
- Fast + typesafe + extendable

---


## License

MIT — [LICENSE](./LICENSE)

---

## Contributing

Pull requests are welcome! If you'd like to add a feature, fix a bug, or improve documentation:

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a PR

---

## Contact

Made with ❤️ by Wilson Adenuga - [@Adenugawilson](https://x.com/Adenugawilson) - oluwatunmiseadenuga@gmail.com

---

## Support

If you find this package useful, please consider [⭐ starring the repository on GitHub](https://github.com/oluwatunmiisheii/disposable-email-validator)! It helps others discover the project and motivates continued development.