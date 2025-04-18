# Ericsson Customer Acceptance app

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).
It is the front-end for Ericsson Customer Acceptance.

## Development environment setup

Install the latest Nodejs version fitting the version configured in file `.nvmrc`.
To manage installed Nodejs versions on your environment it is recommended to use the node version manager <https://github.com/nvm-sh/nvm> .

```bash
# To install the version configured in .nvmrc via nvm run
nvm install

# To use the installed version that is configured in .nvmrc via nvm run
nvm use

# E.g.
$ nvm use
Found '.nvmrc' with version <16>
Now using node v16.18.0 (npm v8.19.2)
$ node --version
v16.18.0
```

After setting up the correct Nodejs version, install the package dependencies required for development.
Setup internal npm repo authentication for your account.
Refer to <https://dev.azure.com/ericsson/Blockchain_ECA/_packaging?_a=connect&feed=shared-artifacts%40Local> `-> npm -> Other` to setup your personal access token.
Add this token to your user `.npmrc` file like in the following example but replacing the `[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]` with your encoded token.

```bash
; begin auth token 
//ericsson.pkgs.visualstudio.com/_packaging/shared-artifacts%40Local/npm/registry/:username=ericsson 
//ericsson.pkgs.visualstudio.com/_packaging/shared-artifacts%40Local/npm/registry/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
//ericsson.pkgs.visualstudio.com/_packaging/shared-artifacts%40Local/npm/registry/:email=npm requires email to be set but doesn't use the value
//ericsson.pkgs.visualstudio.com/_packaging/shared-artifacts%40Local/npm/:username=ericsson 
//ericsson.pkgs.visualstudio.com/_packaging/shared-artifacts%40Local/npm/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
//ericsson.pkgs.visualstudio.com/_packaging/shared-artifacts%40Local/npm/:email=npm requires email to be set but doesn't use the value
; end auth token
; begin auth token
//pkgs.dev.azure.com/ericsson/_packaging/shared-artifacts%40Local/npm/registry/:username=ericsson
//pkgs.dev.azure.com/ericsson/_packaging/shared-artifacts%40Local/npm/registry/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
//pkgs.dev.azure.com/ericsson/_packaging/shared-artifacts%40Local/npm/registry/:email=npm requires email to be set but doesn't use the value
//pkgs.dev.azure.com/ericsson/_packaging/shared-artifacts%40Local/npm/:username=ericsson
//pkgs.dev.azure.com/ericsson/_packaging/shared-artifacts%40Local/npm/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
//pkgs.dev.azure.com/ericsson/_packaging/shared-artifacts%40Local/npm/:email=npm requires email to be set but doesn't use the value
; end auth token
```

Run `npm install`.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

The development environment embedded reverse proxy is configured to direct API calls to a local API server.
To use the app against a stubbed API server also run the stub according to [../stubs/general-api/README.md](../stubs/general-api/README.md)

## Code scaffolding

Run `npx ng generate component component-name` to generate a new component. You can also use `npx ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Manual build example of the app

```bash
# Save current directory in shell session variable
ECA_UI_SRC=$(pwd)
# Create separate work tree of the branch to build (NOTE: being at the same branch is not allowed)
git worktree add ~/git/ericsson/eca/feature-product-eca-ui-build main
cd ~/git/ericsson/eca/feature-product-eca-ui-build
git pull
# If audit fix updates dependencies consider updating the source as well.
# Read more at https://docs.npmjs.com/cli/v8/commands/npm-audit .
npm audit --omit=dev || printf 'Audit identified vulnerabilities.\nUtilize npm audit fix --production to resolve those and add updated package-lock.json in code repository.'
# Install dependencies
npm ci
# Build app
npm run build
# Package/zip build result
(
cd dist || exit
7z a ../app.7z .
)
# 7z l app.7z # to list content

# remove un-tracked files from deployment build
git clean --force
# restore changed files
git restore .
cd "$ECA_UI_SRC"
git worktree remove ~/git/ericsson/eca/feature-product-eca-ui-build
```

## Pre-commit hooks

The project makes use of pre-commit hooks with husky package. The hooks get installed with the command `npm install`. In case they do not work, run `npm prepare` to install them manually.

## Patches

Patches are maintained in directory `./patches`. For more information read the `README.md` in the respective directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
