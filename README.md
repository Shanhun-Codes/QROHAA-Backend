<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# QROHAA-Backend

### Brokerage onboarding and existing-user roles

Start the interactive CLI with a Cognito-registered loopback callback:

```sh
COGNITO_CLI_REDIRECT_URI=http://localhost:8765/callback npm run admin
```

For a new brokerage administrator, choose **Create invitation → Brokerage administrator**,
enter their email, and share the generated setup link. The portal verifies the invitation
and displays a brokerage name/headline form. Redemption creates the brokerage and its
administrator together. After granting beta/paid access, the administrator can complete
brokerage details and branding in **Brokerage Settings**.

For an existing user, choose **Change user role / assign or create brokerage**. Select the
user and role, then keep their current brokerage, select an existing brokerage, or enter a new
brokerage name. Brokerage administrators require a brokerage. Existing agent profiles are
retained and linked to that brokerage, inheriting its branding and brokerage information.
The operation enforces agent seat limits including outstanding invitations and records
an audit entry. Transfers between agencies and platform-admin role changes are rejected.
Demotion to Agent requires an existing agent profile and retains brokerage membership.

Role changes do not activate suspended/pending accounts or grant access. Use the existing
status/access actions separately. Reload the portal or sign in again to refresh the role;
brokerage administrators can edit the brokerage in **Brokerage Settings**. A new brokerage can be
given beta/paid access using **Grant additional beta/paid access → Brokerage**.

These flows require the updated backend and portal to be deployed together. No database
migration is required.

### Terminology boundary

The product calls managed organizations **brokerages**. UI labels, invitation email
copy, CLI prompts, and API error messages use that terminology.

Internal identifiers retain `Agency`, `agencyId`, `AGENCY_ADMIN`, the `AGENCY`
invitation type, and existing API/storage paths for compatibility. These identifiers
represent a managed brokerage organization. The existing `Brokerage` model is a
separate business/contact-details record, owned by an organization or an individual
agent. Do not rename `Agency` to `Brokerage` mechanically: that would collide with
this existing model.

A future coordinated internal rename should first decide whether the managed
organization becomes `Organization` and the contact record becomes
`BrokerageDetails`, or whether those records should be consolidated. It must include
data-preserving migrations, API compatibility, persisted role/invitation values,
storage paths, and frontend clients. Until then, new visible copy uses “brokerage”
while integrations use the established identifiers.

### Standalone testing brokerage

Platform administrators can use **Create brokerage (keep platform-admin role)**
in the admin CLI to create a named brokerage without altering their role. In the
portal, switch to the Brokerage App and choose the new brokerage to configure its
branding and invite an agent. Grant access separately using the CLI if needed.
