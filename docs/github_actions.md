# GitHub Actions & CI/CD for Mise

## What is GitHub Actions?
GitHub Actions is an automation tool built into GitHub. It lets you define workflows that run on events like code pushes or pull requests. These workflows can automate testing, linting, building, and deploying your code.

## What is CI/CD?
- **CI (Continuous Integration):** Automatically runs checks (like tests and schema validation) on every code change to catch errors early.
- **CD (Continuous Deployment/Delivery):** Automatically deploys your app (or prepares it for deployment) after successful checks.

## How It Works in Mise
A workflow file at `.github/workflows/ci.yml` defines the steps:
1. **Trigger:** Runs on every push or pull request.
2. **Setup:** Checks out the code and sets up Node.js.
3. **Install:** Installs dependencies with `npm install`.
4. **Validate:** Runs `npm run validate-schema` to check the database schema.

## Example Workflow
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run validate-schema
```

## How to Extend
- Add more steps (e.g., `npm test`, linting, deployment)
- Use secrets for environment variables
- Trigger on other events (releases, tags)

## Resources
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) 