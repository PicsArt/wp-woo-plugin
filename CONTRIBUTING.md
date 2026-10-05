# Contributing to Picsart for WordPress and WooCommerce

Read the [README](README.md), [Code of Conduct](CODE_OF_CONDUCT.md), and [security reporting guide](SECURITY.md) before contributing. This guide follows the Picsart Figma plugin's contribution practices, adapted to this repository.

## Scope and architecture

This is the public WordPress plugin distribution with readable browser source. PHP runs inside WordPress; the React/TypeScript workspace runs in the admin browser and uses WordPress's `wp.element`. A separately hosted service performs account and cloud operations. Its implementation, production provisioning, credentials, and integration test harness are not included here.

The upstream development repository is Picsart's `pa-plugins` GitLab repository, app `apps/wordpress-product-videos`. Public contributors can submit changes here; maintainers reconcile accepted changes upstream before the next distribution import. Do not overwrite public contributions during a sync.

| Path | Purpose |
| --- | --- |
| `picsart-ai-image-editor.php` | Plugin header, bootstrap, hooks, admin entry points |
| `includes/` | PHP REST handlers, permissions, media, blocks, account and onboarding integrations; small companion JavaScript files |
| `assets/` | Runtime browser bundles, native editor/media scripts, and styles |
| `images/` | Plugin artwork |
| `source/src/ui/` | Readable React/TypeScript workspace and adjacent unit tests |
| `source/shared/` | Shared types, options, validation, and tests |
| `source/scripts/build.mjs` | Browser build using WordPress React |
| `source/package.json`, `source/package-lock.json` | Exact build dependencies |
| `source/vendor/gifenc/` | Readable third-party GIF encoder source and license |
| `readme.txt` | WordPress directory metadata, service disclosures, changelog |
| `uninstall.php` | Uninstall behavior |
| `distribution-manifest.json` | Imported ZIP provenance, hash, and file inventory; not a checksum of this Git repository |
| `CODEOWNERS` | Repository review ownership |

## Local setup

Use Node.js 24, npm, WordPress 6.8 or newer, and PHP 8.2 or newer. Add WooCommerce to a disposable site when testing commerce integration. Use an isolated test site, not a merchant store.

```bash
cd source
npm ci --ignore-scripts
npm run build
npm run typecheck
# Example focused unit tests included in the public source:
node --import tsx --test src/ui/active-image.test.ts src/ui/history.test.ts
```

See [source/README.md](source/README.md) for copying build output into the runtime plugin. The copied package manifest retains upstream scripts: `npm test`, `npm run dev`, `npm run package`, and server/integration commands depend on files absent from this public distribution. Do not use them as public-repository validation gates. Some native-block tests also reference the upstream directory layout. There is no `npm run gate` here.

To test installation, place the runtime plugin in `wp-content/plugins/picsart-ai-image-editor/` and activate it. Cloud testing needs an approved provisioned test service and account. Do not add shared API keys or expose service secrets to make a local test pass. Public automatic enrollment is not implemented in this snapshot.

## Implementation rules

- Keep WordPress capabilities, REST nonces, sanitization, escaping, and attachment ownership checks intact. Test Posts, Pages, custom post types, and WooCommerce destinations when applicable.
- Generation can spend credits. Preserve explicit price approval, duplicate-request protection, and result recovery. A completed job must not silently accept or import a result.
- Never run paid calls as part of unit tests. Use mocks; live tests require explicit credit authorization.
- Preserve originals. Test accept, regenerate, cancel, stale selection, network failure, and reopening a pending job for changes to media workflows.
- Use native WordPress controls where appropriate, translated PHP/JavaScript strings, keyboard-accessible actions, and meaningful labels.
- Edit readable source before rebuilding generated workspace assets. Native scripts in `assets/` and `includes/` are edited directly. Do not bundle a separate React runtime.
- Explain why a guard exists in comments; avoid comments that merely restate the code. Follow surrounding PHP and TypeScript conventions.
- Keep credentials, account identifiers, private media, test databases, dependencies, and local configuration out of commits and issue reports.

## Pull requests

Fork or create a focused branch, make a reviewable change, and open a PR against `main`. Describe the user-visible problem, final behavior, verification, and remaining limitations. Include screenshots for UI changes with private data removed. Add meaningful tests for behavior changes, especially paid or authorization-sensitive paths.

Request code-owner review according to `CODEOWNERS` and current branch protection. Picsart maintainers merge changes; this guide does not invent an approval count or bypass repository protection. No automatic checks are configured by these docs. Run and report the relevant checks yourself, and distinguish public-source checks from maintainer-only service tests.

## License

Contributions to first-party plugin code are under **GPL-2.0-or-later**, matching the plugin header and [LICENSE.txt](LICENSE.txt). Do not copy the Figma plugin's MIT license over this repository's license. Preserve third-party notices and identify the origin and license of added dependencies in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

See [RELEASING.md](RELEASING.md) for packaging and publication.
