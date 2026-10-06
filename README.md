# Picsart for WordPress and WooCommerce

Picsart Commerce adds AI image generation, image editing, video generation, and media tools to WordPress and WooCommerce. Users connect their Picsart account and explicitly approve generation costs and review results before importing them.

## WordPress and optional integrations

One Picsart Commerce plugin supports standard WordPress and enhances workflows when WooCommerce and/or All in One SEO (AIOSEO) are installed:

- **WordPress:** supported Media Library, post, page, custom post type and featured-image workflows.
- **WooCommerce:** product image, gallery and product-video workflows, with product selection and supported placement controls.
- **All in One SEO:** generate or edit an image, save it to the WordPress Media Library, and select it for social/Open Graph images in AIOSEO. The integration uses the standard WordPress media picker; it does not automatically modify AIOSEO metadata or cover every custom picker.

Neither optional plugin is required for general WordPress media use. Cloud tools share the setup, consent, OAuth, quote approval and result-review requirements in [readme.txt](readme.txt). Final installed-version compatibility testing remains required; this description is not a claim that those tests have passed.

## Review snapshot

This public plugin copy comes from the canonical GitLab `picsart/pa-plugins` repository at commit `a9784ecedb6022dfb7e70a3185997e3163e7e97c` (GitLab MR73 feature branch; not yet merged into GitLab main), app `apps/wordpress-product-videos`. It contains the allowlisted WordPress distribution and readable browser source, not the private companion-service implementation or repository history.

Version: 1.1.2 (review snapshot). Background removal and enhancement are restored through the connected-account OAuth service. Actions display credit costs and require approval; current verified quotes were 0 credits for background removal and 2 credits for enhancement. Service quotes remain authoritative.

## Install for review

Package this repository's plugin files inside a `picsart-ai-image-editor` directory, zip that directory, and use **Plugins → Add New → Upload Plugin** in WordPress. Activate **Picsart**. The native onboarding notice links to the connection flow.

**Public rollout is not yet ready:** automatic connection setup for a fresh installation remains incomplete. The supported public experience must be install, activate and connect a Picsart account through OAuth. End users and marketplace reviewers must not configure internal service settings, shared secrets or installation identifiers. Completing that experience is a release requirement, not a reviewer setup task. Merging this source-review PR does not establish marketplace approval or a working public service deployment.

## Source and license

See [source/README.md](source/README.md) for browser asset rebuild instructions, [readme.txt](readme.txt) for plugin behavior and external-service disclosures, [LICENSE.txt](LICENSE.txt), and [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

## Validation

The upstream snapshot passed 211 application tests, TypeScript checking, and the build/package gate (127 allowlisted files). The public browser source also passed its build, TypeScript checking, and all 13 included standalone tests. These checks do not establish live installed or production acceptance. GitLab review retains a live Wix analytics Debug acceptance blocker. Production enrollment, supported public free-to-edit catalog/embed contracts, final live support verification, and a fresh Plugin Check remain release work. Unsupported public catalog access fails closed; connected Drive remains available.

WordPress.org publication uses plugin ZIP submission and, after approval, WordPress.org SVN. GitHub hosts this reviewable source copy; it does not replace directory submission.

## Contributing and support

- [Contribution guide and project structure](CONTRIBUTING.md)
- [Release and packaging guide](RELEASING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Private security reporting](SECURITY.md)
- [Picsart Support](https://support.picsart.com/hc/en-us/requests/new)

First-party plugin code is GPL-2.0-or-later; see [LICENSE.txt](LICENSE.txt). Third-party components retain their own notices. The contribution and conduct guidance is adapted from the [Picsart Figma plugin](https://github.com/PicsArt/picsart-figma-plugin); its MIT project license does not replace this plugin's GPL license.
