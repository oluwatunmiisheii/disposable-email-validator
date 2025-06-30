# Disposable Email Validator

![npm](https://img.shields.io/npm/v/disposable-email-validator)
![types](https://img.shields.io/npm/types/disposable-email-validator)
![license](https://img.shields.io/npm/l/disposable-email-validator)
![build](https://img.shields.io/github/actions/workflow/status/oluwatunmiisheii/disposable-email-validator/ci.yml?label=build)
![tests](https://img.shields.io/badge/tests-vitest-green)

> Filter temporary/disposable email domains and normalize email addresses, with environment-specific rules.

---

## ✨ Features

- 🚫 Block disposable email addresses
- ➕ Optional plus addressing validation (e.g., `user+tag@gmail.com`)
- ✅ Allowlist support for trusted emails/domains
- 🌍 Environment-based configuration (`development`, `staging`, `test`, `production`)
- 📝 Fully typed with TypeScript

---

## 📦 Installation

```bash
npm install disposable-email-validator
```

---

## ⚡ Quick Start

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

## ⚙️ Configuration

The library uses environment-based configuration to support different validation rules for `development`, `staging`, `production`, or `test`.

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
    trustedDomains: ['tempmail.org', 'company.com']
  }
};
```

---

## 🔧 Configuration Reference

| Key                | Type        | Required | Default           | Description |
|--------------------|-------------|----------|-------------------|-------------|
| `rules.allow_disposable_emails` | `boolean` | ✅ | – | Blocks disposable domains |
| `rules.allow_plus_addressing`       | `boolean` | ✅ | – | Blocks plus-addressed emails |
| `disposableDomains`         | `string[]` | ❌ | Built-in list      | Domains to block |
| `trustedDomains`         | `string[]` | ❌ | `undefined`        | Emails/domains to allow regardless of rules |


---

## 🧪 API

### Constructor

```ts
new DisposableEmailValidator(environment: string, config: DisposableEmailValidatorConfig)
```

- `environment`: one of the config environments (`production`, `development`, `staging`, `test`, etc.)
- `config`: your full multi-env configuration

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

## 🧠 Default Blocked Domains

If `disposableDomains` is not provided, this package includes a prebuilt list from [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains).

You get coverage for thousands of known throwaway providers out of the box.

---

## 💡 Why Use This?

- 💼 Designed for production apps
- 🔐 Prevent fake signups from temporary emails
- ⚙️ Multiple environments supported
- 🧪 Built-in domain blacklist
- ✅ Fast + typesafe + extendable

---


## 📜 License

MIT — [LICENSE](./LICENSE)

---

## 🤝 Contributing

Pull requests are welcome! If you'd like to add a feature, fix a bug, or improve documentation:

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a PR