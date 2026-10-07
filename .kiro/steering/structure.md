# Project Structure

The workspace is currently empty (no source files). Update this file as the project takes shape.

## Current Layout

```
AWS/
└── .kiro/
    └── steering/       # Kiro AI assistant guidance files
```

## Recommended Structure (placeholder)

Adapt based on what gets built. Common AWS project layouts:

**CDK / IaC project**
```
AWS/
├── bin/                # CDK app entry point
├── lib/                # Stack and construct definitions
├── test/               # Unit tests for stacks
├── cdk.json
└── package.json
```

**Lambda / serverless project**
```
AWS/
├── src/                # Application source code
│   └── handlers/       # Lambda function handlers
├── infra/              # IaC (CDK, SAM, or CloudFormation templates)
├── tests/
└── package.json / requirements.txt
```

**General convention**
- Keep infrastructure code separate from application code
- Store environment-specific config in dedicated files (not hardcoded)
- Never commit secrets or credentials; use AWS Secrets Manager or SSM Parameter Store
