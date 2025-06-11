# Email Security Filter

A powerful and flexible npm package for filtering temporary/disposable email domains and normalizing email addresses with environment-specific rule configurations.

## 🚀 Features

- **Environment-Specific Rules**: Different validation rules for development, staging, beta, and production
- **Custom Rule Arrays**: Define rules using simple string arrays for each environment
- **Temporary Domain Filtering**: Block disposable/temporary email services
- **Email Normalization**: Handle plus addressing (`user+tag@domain.com`) and dot variations
- **Express.js Middleware**: Ready-to-use middleware for web applications
- **TypeScript Support**: Full type definitions included
- **Zero Dependencies**: Lightweight with no external dependencies
- **Batch Processing**: Validate multiple emails at once
- **Extensible**: Add custom blocked domains and update domain lists

## 📦 Installation

```bash
npm install email-security-filter
```

## 🎯 Quick Start

### Basic Usage

```javascript
const { EmailSecurityFilter } = require('email-security-filter');

const filter = new EmailSecurityFilter({
  environment: 'production',
  environmentConfigs: {
    production: ['no_temp', 'no_plus', 'strict', 'real_only']
  }
});

const result = filter.validateEmail('user+test@tempmail.org');
console.log(result);
// {
//   isValid: false,
//   issues: ['temporary_domain_blocked', 'plus_addressing_blocked'],
//   normalizedEmail: 'user@tempmail.org',
//   environment: 'production'
// }
```

### Express.js Middleware

```javascript
const { createEmailFilterMiddleware } = require('email-security-filter');

const emailMiddleware = createEmailFilterMiddleware({
  environment: process.env.NODE_ENV,
  environmentConfigs: {
    development: ['allow_plus', 'allow_temp', 'log'],
    staging: ['allow_plus', 'no_temp', 'log'],
    production: ['no_plus', 'no_temp', 'strict', 'real_only']
  },
  emailFields: ['email', 'contactEmail']
});

app.use('/api/register', emailMiddleware);
```

## 🔧 Configuration

### Environment-Specific Rules

Configure different validation rules for each environment:

```javascript
const filter = new EmailSecurityFilter({
  environment: 'staging',
  environmentConfigs: {
    development: [
      'allow_plus',      // Allow + addressing
      'allow_dots',      // Allow dot variations  
      'allow_temp',      // Allow temporary domains
      'allow_test',      // Allow test domains
      'log'              // Enable logging
    ],
    staging: [
      'allow_plus',      // Allow + addressing
      'no_temp',         // Block temporary domains
      'allow_test',      // Allow test domains
      'log'              // Enable logging
    ],
    beta: [
      'no_plus',         // Block + addressing
      'no_dots',         // Block dot variations
      'no_temp',         // Block temporary domains
      'no_test',         // Block test domains
      'real_only',       // Require real domains only
      'strict'           // Strict validation mode
    ],
    production: [
      'no_plus',         // Block + addressing
      'no_dots',         // Block dot variations
      'no_temp',         // Block temporary domains
      'no_test',         // Block test domains
      'real_only',       // Require real domains only
      'strict',          // Strict validation mode
      'no_log'           // Disable logging
    ]
  }
});
```

### Available Rule Options

| Rule | Aliases | Description |
|------|---------|-------------|
| **Plus Addressing** |
| `allow_plus` | `allow_plus_addressing` | Allow emails with + tags |
| `no_plus` | `block_plus_addressing` | Block emails with + tags |
| **Dot Variations** |
| `allow_dots` | `allow_dot_variations` | Allow dot variations in Gmail-like services |
| `no_dots` | `block_dot_variations` | Block dot variations |
| **Temporary Domains** |
| `allow_temp` | `allow_temp_domains` | Allow temporary/disposable domains |
| `no_temp` | `block_temp_domains` | Block temporary/disposable domains |
| **Test Domains** |
| `allow_test` | `allow_test_domains` | Allow test domains (example.com, test.com) |
| `no_test` | `block_test_domains` | Block test domains |
| **Domain Requirements** |
| `real_only` | `require_real_domains` | Only allow legitimate domains |
| `any_domain` | `allow_any_domains` | Allow any domain format |
| **Validation Mode** |
| `strict` | `strict_mode` | Strict validation (fail on any issue) |
| `lenient` | `lenient_mode` | Lenient validation (warnings only) |
| **Logging** |
| `log` | `enable_logging` | Enable violation logging |
| `no_log` | `disable_logging` | Disable logging |

## 📋 API Reference

### EmailSecurityFilter Class

#### Constructor Options

```javascript
const filter = new EmailSecurityFilter({
  environment: 'production',           // Current environment
  environmentConfigs: {                // Rules per environment
    development: ['allow_plus', 'log'],
    production: ['strict', 'no_temp']
  },
  customBlockedDomains: ['spam.com'],  // Additional domains to block
  
  // Direct rule overrides (optional)
  allowPlusAddressing: false,
  strictMode: true,
  logViolations: true
});
```

#### Methods

##### `validateEmail(email: string)`

Validates a single email address.

```javascript
const result = filter.validateEmail('user+test@gmail.com');
// Returns EmailValidationResult
```

**Returns:**
```javascript
{
  isValid: boolean,
  normalizedEmail: string | null,
  issues: string[],
  warnings: string[],
  domain: string,
  isTemporary: boolean,
  isTestDomain: boolean,
  isRealDomain: boolean,
  environment: string,
  appliedRules: object
}
```

##### `validateBatch(emails: string[])`

Validates multiple email addresses at once.

```javascript
const results = filter.validateBatch([
  'user1@gmail.com',
  'user2@tempmail.org',
  'user3+tag@yahoo.com'
]);
```

##### `normalizeEmail(email: string)`

Normalizes an email address based on current rules.

```javascript
const normalized = filter.normalizeEmail('User+Tag@Gmail.com');
// Returns: 'user@gmail.com' (if plus addressing blocked)
```

##### `isTempDomain(email: string)`

Checks if an email's domain is temporary/disposable.

```javascript
const isTemp = filter.isTempDomain('user@10minutemail.com');
// Returns: true
```

##### `addTempDomain(domain: string)`

Adds a domain to the temporary domain list.

```javascript
filter.addTempDomain('newspam.com');
```

##### `updateTempDomains(url: string)`

Updates temporary domain list from external source.

```javascript
await filter.updateTempDomains('https://api.example.com/temp-domains.json');
```

### Express.js Middleware

#### `createEmailFilterMiddleware(options)`

Creates Express.js middleware for automatic email validation.

```javascript
const middleware = createEmailFilterMiddleware({
  environment: 'production',
  environmentConfigs: {
    production: ['strict', 'no_temp']
  },
  emailFields: ['email', 'contactEmail'],  // Fields to validate
});

app.use('/api/users', middleware);
```

The middleware will:
- Validate specified email fields in `req.body`
- Return 400 error for invalid emails
- Replace emails with normalized versions
- Add validation results to `req.emailValidation`

## 🌍 Environment Examples

### Development - Permissive
```javascript
const devFilter = new EmailSecurityFilter({
  environment: 'development',
  environmentConfigs: {
    development: ['allow_plus', 'allow_temp', 'allow_test', 'log']
  }
});

// Allows almost everything, just logs warnings
const result = devFilter.validateEmail('test+user@tempmail.org');
// { isValid: true, warnings: ['temporary_domain_detected'] }
```

### Staging - Moderate
```javascript
const stagingFilter = new EmailSecurityFilter({
  environment: 'staging', 
  environmentConfigs: {
    staging: ['allow_plus', 'no_temp', 'allow_test', 'log']
  }
});

// Blocks temp domains but allows test domains and plus addressing
const result = stagingFilter.validateEmail('user+tag@test.com');
// { isValid: true, warnings: ['test_domain_detected'] }
```

### Production - Strict
```javascript
const prodFilter = new EmailSecurityFilter({
  environment: 'production',
  environmentConfigs: {
    production: ['strict', 'no_plus', 'no_temp', 'no_test', 'real_only']
  }
});

// Only allows legitimate email domains
const result = prodFilter.validateEmail('user@gmail.com');
// { isValid: true, isRealDomain: true }
```

## 🔄 Dynamic Configuration

Load configuration from environment variables or config files:

```javascript
// config/email-rules.js
module.exports = {
  development: ['allow_plus', 'allow_temp', 'log'],
  staging: ['allow_plus', 'no_temp', 'log'],
  beta: ['no_plus', 'no_temp', 'strict'],
  production: ['strict', 'no_plus', 'no_temp', 'real_only', 'no_log']
};

// app.js
const emailRules = require('./config/email-rules');

const filter = new EmailSecurityFilter({
  environment: process.env.NODE_ENV || 'development',
  environmentConfigs: emailRules
});
```

## 🛡️ Security Features

### Temporary Domain Detection
Blocks common disposable email services:
- 10minutemail.com, guerrillamail.com, mailinator.com
- tempmail.org, throwaway.email, yopmail.com
- And 100+ more temporary email domains

### Email Normalization
- **Plus Addressing**: `user+tag@domain.com` → `user@domain.com`
- **Dot Variations**: `u.s.e.r@gmail.com` → `user@gmail.com` (Gmail-like services)
- **Case Normalization**: `User@Domain.COM` → `user@domain.com`

### Domain Validation
- Test domain detection (example.com, test.com, localhost)
- Real domain format validation
- Custom domain blocking

## 📊 Batch Processing

Process multiple emails efficiently:

```javascript
const emails = [
  'user1@gmail.com',
  'user2@tempmail.org', 
  'user3+tag@yahoo.com',
  'invalid-email'
];

const results = filter.validateBatch(emails);

results.forEach(result => {
  if (!result.isValid) {
    console.log(`${result.email}: ${result.issues.join(', ')}`);
  }
});
```

## 🔌 Integration Examples

### With User Registration

```javascript
app.post('/register', createEmailFilterMiddleware({
  environment: 'production',
  environmentConfigs: {
    production: ['strict', 'no_temp', 'real_only']
  }
}), (req, res) => {
  // Email has been validated and normalized
  const user = new User({
    email: req.body.email, // Already normalized
    name: req.body.name
  });
  
  // Access validation details
  if (req.emailValidation.email.warnings.length > 0) {
    console.log('Email warnings:', req.emailValidation.email.warnings);
  }
  
  user.save();
});
```

### With Existing Validation Libraries

```javascript
const Joi = require('joi');
const { EmailSecurityFilter } = require('email-security-filter');

const filter = new EmailSecurityFilter({
  environment: 'production',
  environmentConfigs: {
    production: ['strict', 'no_temp']
  }
});

const schema = Joi.object({
  email: Joi.string().email().custom((value, helpers) => {
    const result = filter.validateEmail(value);
    if (!result.isValid) {
      return helpers.error('email.security', { 
        issues: result.issues 
      });
    }
    return result.normalizedEmail;
  })
});
```

## 🧪 Testing

```javascript
// test/email-filter.test.js
const { EmailSecurityFilter } = require('email-security-filter');

describe('EmailSecurityFilter', () => {
  test('blocks temporary domains in production', () => {
    const filter = new EmailSecurityFilter({
      environment: 'production',
      environmentConfigs: {
        production: ['no_temp', 'strict']
      }
    });
    
    const result = filter.validateEmail('user@tempmail.org');
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('temporary_domain_blocked');
  });
  
  test('allows temporary domains in development', () => {
    const filter = new EmailSecurityFilter({
      environment: 'development', 
      environmentConfigs: {
        development: ['allow_temp', 'log']
      }
    });
    
    const result = filter.validateEmail('user@tempmail.org');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('temporary_domain_detected');
  });
});
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## 📞 Support

- GitHub Issues: Report bugs and request features
- Documentation: Full API documentation available
- Community: Join our Discord for discussions

## 🔄 Changelog

### v1.0.0
- Initial release
- Environment-specific rule configuration
- Express.js middleware support
- TypeScript definitions
- Comprehensive temporary domain list