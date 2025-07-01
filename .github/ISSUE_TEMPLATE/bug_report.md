---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

name: Bug Report
description: Report something that isn’t working as expected
labels: [bug]
body:
  - type: markdown
    attributes:
      value: |
        ## 🐛 Bug Report

        Thanks for reporting an issue! Please fill out the details below so we can reproduce and fix it quickly.

  - type: input
    id: environment
    attributes:
      label: Environment
      description: What environment were you using? (e.g. `production`, `development`, etc.)
      placeholder: production
    validations:
      required: true

  - type: input
    id: email
    attributes:
      label: Example email
      description: What email address did you test with?
      placeholder: user@10minutemail.com
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: What happened?
      description: Describe the bug or unexpected behavior
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: What did you expect to happen?
      description: Describe the expected behavior
    validations:
      required: true

  - type: textarea
    id: config
    attributes:
      label: Configuration
      description: Paste your config object (if customized)
      render: TypeScript

  - type: dropdown
    id: platform
    attributes:
      label: Where are you running this?
      options:
        - Node.js
        - Browser
        - Other
    validations:
      required: true

  - type: textarea
    id: notes
    attributes:
      label: Additional notes or suggestions
      description: Anything else we should know?
