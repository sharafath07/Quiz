# Security Policy

## Supported Versions

Security fixes are generally made against the current development version of the project.

Because this is an actively developed open-source project, users should keep their deployments and dependencies up to date.

## Reporting a Vulnerability

Please do **not** report security vulnerabilities through public GitHub Issues.

For a vulnerability that could affect users or deployments, contact the project maintainer privately through the contact method listed on the maintainer's GitHub profile:

https://github.com/sharafath07

When reporting a vulnerability, please include:

- A clear description of the issue
- Steps to reproduce it
- The affected component or endpoint
- Potential impact
- Any suggested mitigation, if known

Please avoid including real credentials, personal data, or production secrets in your report.

## Responsible Disclosure

Please allow reasonable time for the issue to be investigated and addressed before publicly disclosing technical details.

## Security for Self-Hosted Deployments

If you deploy Quiz yourself:

- Never commit `.env` files or production credentials.
- Use strong, unique database credentials.
- Use HTTPS in production.
- Restrict database access to trusted hosts.
- Keep Node.js and npm dependencies updated.
- Configure `CLIENT_URL` to the intended frontend origin.
- Do not expose PostgreSQL directly to the public internet unless your infrastructure explicitly requires it.
