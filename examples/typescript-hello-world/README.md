# test-debug

## Getting started

This project is using _Node_ 16. It is highly recommended you use a _Node_ version manager (i.e. [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)) so you can switch easily (`nvm use`) between projects.

### Testing

```shell
npm ci
npm t
```

### Build & deploy

This project is automatically built and deployed using _GitHub actions_ triggered on commits to the `develop` & `main` branches.

You can also use the [_AWS Command Line Interface_ (_AWS CLI_)](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)* & [_AWS SAM command line interface_ (_AWS SAM CLI_)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to build and deploy manually.

```shell
aws sso login
sam build --parallel && sam deploy
```

> \* Note! Remember to [configure _AWS CLI_ using _Single Sign-On (SSO)_](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html). Make sure to use the _default_ profile.