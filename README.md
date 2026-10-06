# Picsart for WordPress and WooCommerce

Picsart Commerce adds AI image generation, image editing, video generation, and media tools to WordPress and WooCommerce. Users connect their Picsart account and explicitly approve generation costs and review results before importing them.

## Review snapshot

This public plugin copy comes from the canonical GitLab `picsart/pa-plugins` repository at commit `10e9c99`, app `apps/wordpress-product-videos`. It contains the allowlisted WordPress distribution and readable browser source, not the private companion-service implementation or repository history.

Version: 1.1.2. Background removal and upscaling are Phase 2 and are not offered in this release.

## Install for review

Package this repository's plugin files inside a `picsart-ai-image-editor` directory, zip that directory, and use **Plugins → Add New → Upload Plugin** in WordPress. Activate **Picsart**. The native onboarding notice links to the connection flow.

**Public rollout is not yet ready:** cloud features require a provisioned companion service. Automatic production installation enrollment and the production service destination remain unresolved. Merging this source-review PR does not establish marketplace approval or a working public service deployment. Do not ask merchants to configure internal bridge credentials.

## Source and license

See [source/README.md](source/README.md) for browser asset rebuild instructions, [readme.txt](readme.txt) for plugin behavior and external-service disclosures, [LICENSE.txt](LICENSE.txt), and [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

## Validation

The source snapshot passed the app build/package gate, 147 application tests before the onboarding change, native WordPress integration tests including Dashboard/Posts/Pages/Media/WooCommerce onboarding, and five onboarding connection-state tests. The current package has not completed a fresh Plugin Check run because the local Docker daemon was unavailable. Public production enrollment, full remote catalog/embed contracts, and final live support verification remain release work.

WordPress.org publication uses plugin ZIP submission and, after approval, WordPress.org SVN. GitHub hosts this reviewable source copy; it does not replace directory submission.

## Contributing and support

- [Contribution guide and project structure](CONTRIBUTING.md)
- [Release and packaging guide](RELEASING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Private security reporting](SECURITY.md)
- [Picsart Support](https://support.picsart.com/hc/en-us/requests/new)

First-party plugin code is GPL-2.0-or-later; see [LICENSE.txt](LICENSE.txt). Third-party components retain their own notices. The contribution and conduct guidance is adapted from the [Picsart Figma plugin](https://github.com/PicsArt/picsart-figma-plugin); its MIT project license does not replace this plugin's GPL license.
