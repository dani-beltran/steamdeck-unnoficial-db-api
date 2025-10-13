# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the steamdeck-unofficial-db-api project.

## Workflows

### CI/CD Pipeline (`ci-cd.yml`)
**Trigger:** 
- Push to `main` branch
- Version tags (v*)
- Pull Requests to `main`

**Purpose:** Complete continuous integration and deployment pipeline

**Jobs:**

#### 1. Test Job
Runs comprehensive testing suite on Node.js 24.x:
- Checkout code
- Setup Node.js environment with npm caching
- Install dependencies via `npm ci`
- Run linter (with soft failure to not block the build)
- Execute tests with coverage using Vitest
- Upload coverage reports to Codecov
- Build TypeScript to verify compilation

#### 2. Build and Push Job
Builds and deploys Docker images (only runs after tests pass):
- Only executes on `main` branch pushes or version tags
- Sets up Docker Buildx for multi-platform builds
- Extracts metadata for Docker tags and labels
- Authenticates with DockerHub
- Builds and pushes multi-platform images (linux/amd64, linux/arm64)
- Uses GitHub Actions cache for faster builds
- Runs Docker Scout CVE security scan (with soft failure)

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### Required:
- `DOCKERHUB_USERNAME` - Your DockerHub username
- `DOCKERHUB_TOKEN` - DockerHub access token (create at https://hub.docker.com/settings/security)

### Optional:
- `CODECOV_TOKEN` - Token for uploading coverage reports to Codecov

## Setting up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the appropriate value

### Creating a DockerHub Token:
1. Log in to https://hub.docker.com
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Give it a descriptive name (e.g., "GitHub Actions")
5. Select "Read, Write, Delete" permissions
6. Copy the token and add it to GitHub secrets

## Docker Image Tags

The workflow automatically generates tags based on the trigger:

- `latest` - Latest build from main branch (only on default branch)
- `main` - Latest build from main branch
- `main-<git-sha>` - Specific commit from main branch
- `v1.0.0` - Full semantic version (when pushing tags like `v1.0.0`)
- `1.0` - Major.minor version (when pushing tags like `v1.0.0`)

**Note:** Pull request builds run tests but do not push Docker images.

## Usage Examples

### Running tests locally
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

### Building and running locally
```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

### Building Docker image locally
```bash
docker build -t decku-api .
docker run -p 8080:8080 decku-api
```

### Deploying a new version
1. Update version in `package.json`
2. Commit changes to main branch
3. Create and push a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. The CI/CD pipeline will automatically:
   - Run linter and tests
   - Build TypeScript
   - Upload coverage to Codecov
   - Build multi-platform Docker images
   - Push to DockerHub
   - Run security scan

## Workflow Features

### Caching
- **npm dependencies**: Cached using Node.js setup action
- **Docker layers**: Cached using GitHub Actions cache (gha) for faster builds

### Multi-Platform Support
Docker images are built for:
- `linux/amd64` (x86_64 processors)
- `linux/arm64` (ARM processors, including Apple Silicon)

### Security
- Docker Scout CVE scanning runs automatically on builds
- Scans for critical and high severity vulnerabilities
- Configured with soft failure to not block deployments

## Troubleshooting

### Tests failing in CI but passing locally
- Ensure all dependencies are properly listed in `package.json`
- Check for environment-specific issues (MongoDB, ports, etc.)
- Review the workflow logs in GitHub Actions for detailed error messages
- Verify Node.js version matches (workflow uses 24.x)

### Docker push failing
- Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are correctly configured
- Check if the DockerHub repository exists (format: `username/steamdeck-unnoficial-db-api`)
- Ensure the access token has write permissions
- Verify the workflow is running on `main` branch or a version tag (not a PR)

### Linter errors
- Linter runs with `continue-on-error: true`, so it won't fail the build
- Fix linting issues locally with `npm run lint`

### Coverage upload failing
- Coverage uploads to Codecov with `fail_ci_if_error: false`
- Ensure `CODECOV_TOKEN` secret is configured (optional but recommended)
- Check Codecov service status if uploads consistently fail

### Build taking too long
- The workflow uses GitHub Actions cache to speed up builds
- Multi-platform Docker builds take longer but provide better compatibility
- First build after cache clear will take longer (~5-10 minutes)
