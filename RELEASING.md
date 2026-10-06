# Releasing Picsart for WordPress and WooCommerce

GitHub stores the public source and review history. WordPress.org uses a ZIP submission and, after approval, its SVN repository. WooCommerce Marketplace submission is a separate review. A merged GitHub PR is not marketplace approval.

## Release readiness

This snapshot is for source review. Resolve production service provisioning and automatic installation enrollment before submission. End users and marketplace reviewers must not be asked to supply internal service settings, shared secrets or installation identifiers; these are implementation responsibilities, not public setup steps. Verify the current service/data-sharing disclosures, account connection, support destinations, and remaining media catalog/embed requirements. WordPress.org requires documented external services and data sharing; it does not prescribe separate hosting-region or retention-schedule fields in the readme. Background removal and enhancement use connected-account OAuth and authoritative service quotes. Verify their current prices and permissions before release; do not promise universal free-plan entitlement. The imported feature branch still requires its recorded live analytics acceptance before GitLab merge.

## Select and validate the commit

1. Start from reviewed `main`, fetch, and confirm a clean working tree. Preserve any local work.
2. Reconcile public changes with the canonical upstream WordPress app before importing a new distribution. Record the upstream commit; never copy monorepo history or companion-service secrets to GitHub.
3. Follow [CONTRIBUTING.md](CONTRIBUTING.md) to rebuild and typecheck public browser source. Run relevant included tests and report their actual scope.
4. Maintainers run the upstream package gate, native WordPress tests, service tests, and a fresh WordPress Plugin Check against the final ZIP. Prior results do not certify a changed package.
5. Test a fresh installation from the ZIP, activation/deactivation, uninstall content handling, permissions, disconnected/connected onboarding, and image/video accept/regenerate flows. Check blog, Page/custom post type, and WooCommerce integration. Use authorized live test accounts only.

## Version and artifacts

Keep the plugin header version, `readme.txt` stable tag/changelog, and `source/package.json` and lockfile versions consistent. Use a new version for a released change; do not replace an already published tag or artifact. Use a versioned Git tag on the reviewed commit when publishing.

The authoritative release ZIP is produced by the upstream `scripts/package.mjs` allowlist, which also emits the distribution manifest. The public copy does not contain that packaging script. Reimport the resulting runtime assets and manifest together after review. `distribution-manifest.json` describes that imported ZIP; documentation-only GitHub commits do not change its hash.

For a **local review ZIP**, the following command from the repository root includes only the runtime plugin and readable source:

```bash
review_zip="$PWD/picsart-ai-image-editor-review.zip"
stage=$(mktemp -d)
mkdir "$stage/picsart-ai-image-editor"
cp -R picsart-ai-image-editor.php uninstall.php includes assets images readme.txt LICENSE.txt THIRD-PARTY-NOTICES.txt source "$stage/picsart-ai-image-editor/"
# Exclude local build dependencies and intermediate output if source was built here.
(cd "$stage" && zip -qr "$review_zip" picsart-ai-image-editor -x '*/node_modules/*' '*/source/plugin/*')
```

Inspect the archive before sharing. It must have one top-level `picsart-ai-image-editor/` directory, the correct main PHP file, and no `.env`, `.git`, local databases, credentials, or installed dependencies. Extract and install that ZIP on a disposable site. Do not call this locally assembled review ZIP the manifest-verified upstream release artifact.

## Publish

- GitHub: publish a reviewed tag and attach the tested release ZIP, checksum, and user-facing release notes. Do not claim a release URL exists before verifying it.
- WordPress.org: follow the [plugin submission guide](https://developer.wordpress.org/plugins/wordpress-org/planning-submitting-and-maintaining-plugins/). After approval, use the assigned SVN repository and [SVN guide](https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/). Keep stable tag, release tag, screenshots, and readme consistent.
- WooCommerce: follow the current [Marketplace submission guidance](https://woocommerce.com/submit-product/); document WooCommerce compatibility and complete the applicable review separately.

Publishing credentials belong in the approved credential manager or release environment, never the repository. These docs do not configure automatic deployment.

## Rollback

Retain the last tested ZIP and its commit/checksum. Diagnose whether a problem is plugin-side or service-side before changing either. For public fixes, create a reviewed revert or repair, assign a new version, repeat validation, and publish through the same channels. Do not rewrite public tags or delete merchant content as a rollback strategy.

## Local PHP and WP-CLI on macOS

With Homebrew installed, run:

```sh
brew install php wp-cli
php -v
wp --info
```

These install command-line tooling; starting a PHP background service is not necessary for CLI checks. A functioning WordPress installation and database are still needed for installed-plugin checks. The plugin declares PHP 8.2 as its minimum; test that version separately as well as the current PHP version.

Official installation references: https://formulae.brew.sh/formula/php and https://make.wordpress.org/cli/handbook/guides/installing/.

## Listing artwork

The `.wordpress-org/` directory contains the seven screenshot files matching readme captions, standard and Retina banners, and icons. Copy its PNG files to WordPress.org SVN's root `assets/` directory after approval. Exclude `.wordpress-org/` from the runtime ZIP. See `.wordpress-org/README.md` for provenance and the interim screenshot limitation.

## Completeness check before WordPress.org submission

Documentation describes the current implementation; it does not certify a complete production integration. Before submitting the ZIP:

- Complete and verify installation-to-OAuth setup against the production service, without requiring merchants to obtain internal bridge credentials.
- Verify consent, account connection/disconnection, exact quotes and approval, image/video result review, imports and supported destinations on a fresh installation.
- Verify error and recovery behavior, permissions, and the behavior of retained local/cloud records on disconnect and uninstall.
- Run Plugin Check on the final ZIP and resolve actionable findings. Reconcile readme claims and screenshots with the shipped behavior.
- Keep unavailable features clearly excluded from claims. Public free-to-edit catalog/remote embed support is not established by the current source.

These are release checks, not a claim that WordPress.org mandates this particular backend architecture. See https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/ (external services, privacy and completeness).
