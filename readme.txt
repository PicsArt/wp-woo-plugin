=== Picsart Commerce ===
Contributors: picsartenterprise
Tags: image editor, product video, woocommerce, media library
Requires at least: 6.8
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 1.1.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Edit image copies in WordPress and connect a configured Picsart service to create product media using your Picsart account.

== Description ==
Picsart Commerce adds local image tools to the Media Library and product editing workflows. Crop, resize, rotate, adjust colour, export JPEG/PNG/WebP, and add a brand mark or protective watermark. Local tools run in your browser and do not spend generation credits. Edits create new attachments and preserve the original. Applying a clean image copy to a supported destination is a separate action, with a restore receipt that refuses to overwrite later changes.

Use Picsart from WordPress with your Picsart account, plan and credits. Cloud tools require a connected Picsart account, explicit permission for cloud access, and an available Picsart service connection. It supports product-photo selection, account and credit information, Picsart Drive browsing, exact generation-price approval, reviewed image/video copies, saved settings, history export, and browser music/GIF exports. WordPress does not collect subscription payments. Manage your subscription and credits at https://picsart.com/.

Remove background and Enhance use the connected Picsart account and display the exact credit price on their buttons before approval. Review each result before accepting it. No shared installation API key is used. The embedded Picsart editor remains deferred. Other AI generation uses the price approved for that operation. This candidate must not be submitted as a completed cloud integration until the release checklist is closed.

= WordPress, WooCommerce and All in One SEO =
One Picsart Commerce plugin serves standard WordPress sites and sites using WooCommerce and/or All in One SEO (AIOSEO). Neither optional plugin is required for general WordPress media workflows.

* WordPress: create and edit media for supported post, page, custom post type and featured-image workflows through the WordPress Media Library and media picker.
* WooCommerce: enhance product image, gallery and product-video workflows, with product-specific media selection and supported placement controls when WooCommerce is active.
* All in One SEO: create or edit an image with Picsart, save it to the WordPress Media Library, then select it in AIOSEO's social/Open Graph image settings. Picsart actions are available where the standard WordPress media picker is used. AIOSEO controls its own image settings and metadata; Picsart does not automatically change SEO settings or guarantee compatibility with custom image pickers.

These integrations share the same account connection, consent, quote approval and result-review flow. Cloud features require the Picsart connection described below. Installed AIOSEO and WooCommerce versions must be included in final integration testing.

= How the Picsart service works =
Picsart supplies the remote AI processing, account authorization, credit pricing and Drive storage used by cloud features. Picsart production services use https://api.picsart.com/ and https://picsart.com/. This candidate uses an integration backend for cloud requests. Automatic connection setup for a fresh installation is not yet complete and remains a release blocker; end users and marketplace reviewers should not be asked to configure internal service settings.

After you allow cloud access, Connect Picsart starts OAuth device authorization. The plugin displays a code and opens the Picsart approval page; you approve the matching code there. The integration backend checks the authorization result and stores the account credentials used for subsequent requests. Your Picsart password is not entered into WordPress. Connection alone does not generate media or purchase credits.

Opening the connected workspace requests account information, balance and available media/model information. Choosing a cloud action sends the selected media and instructions needed for that operation. Requesting an image-based price quote can upload the selected image to Picsart Drive before generation. The plugin shows the service quote and requires your approval before submitting the action. Costs depend on the selected operation and the connected account; a quoted zero-credit action is not a promise that all actions are free. Subscription and credit purchases are handled on Picsart.com.

The service processes submitted jobs and the workspace displays their status. Review the result before accepting and importing it into the WordPress Media Library. Applying an imported file to a post, page or supported product destination is a separate action. The original attachment is preserved. Importing a private Drive file creates a WordPress copy whose upload URL may be publicly accessible.

Cloud functions require a working service connection and valid authorization. If authorization expires or access is missing, reconnect when prompted. If a request fails or its outcome is unclear, check its status in History before starting another generation, to avoid duplicate charges. Local crop, resize and export processing runs in the browser, but this candidate currently gates access to its workspace behind the Picsart connection.

= External services and privacy =
Before enabling cloud access, the plugin asks each user for permission. The configured integration backend receives the site/installation identity, authenticated WordPress user identity, requested operation and selected product/media data. Picsart receives OAuth authorization, account/credit and Drive requests, selected images and generation prompts. Selecting an image for an AI quote uploads a copy to Picsart Drive. Local image processing runs in your browser; this plugin currently requires a Picsart connection before exposing its tools. Generated results remain in Picsart until separately copied into WordPress. Account tokens and operation receipts are handled by the integration backend. In-app notifications and optional account-scoped status emails are available. Email is sent only after a separate opt-in, through the site mail system to the WordPress profile address. Mail-system acceptance is not proof of inbox delivery. Push delivery is not implemented.

Picsart Commerce: https://picsart.com/commerce/
Picsart service: https://picsart.com/
Terms: https://picsart.com/terms-of-use/
Privacy: https://picsart.com/privacy-policy/
Generative AI Additional Terms: https://picsart.com/genaitermsofuse
Support: https://support.picsart.com/hc/en-us/requests/new
Account help: https://support.picsart.com/hc/en-us/categories/4416517803409-Your-profile-account
Subscription and payment help: https://support.picsart.com/hc/en-us/categories/360000192038-Subscription-Payments
Credit help: https://support.picsart.com/hc/en-us/sections/19530880111261-Credits
AI tools help: https://support.picsart.com/hc/en-us/categories/9341772365341-Picsart-AI-Tools
Automatic installation setup is not yet available in this candidate. Completed history archives preserve durable recovery receipts; archiving is not deletion. Disconnecting or uninstalling does not delete companion records, backups or Picsart Drive files. Contact the site administrator about these records and Picsart support about Picsart-held data. WordPress copies of private Drive media may be publicly accessible through upload URLs. Public free-to-edit catalog browsing is unavailable pending a supported reuse and attribution API contract. The configured integration backend relays these requests to Picsart. No analytics or advertising trackers are bundled. Optional live chat loads Picsart’s HubSpot support portal only when you choose Chat with Picsart. Opening it connects your browser to HubSpot, which receives connection information and any messages you choose to enter. Photos, prompts and account details are not automatically added to chat. The widget presents its cookie controls; email and the support form remain available without opening chat.

= Source and build tools =
Readable TypeScript, TSX and CSS source, package lockfile, build script and gifenc source are included in source/. See source/README.md for reproducible npm build instructions. Runtime PHP and native JavaScript are readable. React is supplied by WordPress. Third-party licences are in THIRD-PARTY-NOTICES.txt and source/vendor/gifenc/LICENSE.md.

== Installation ==
1. Upload the picsart-ai-image-editor folder to wp-content/plugins/ and activate it.
2. Open Picsart in the WordPress menu. Tools become available after connecting; editing requires permission to upload and edit the selected media.
3. The supported public setup must be installation, activation and Connect Picsart through OAuth. End users and marketplace reviewers must not need internal server settings, shared secrets or installation identifiers. Automatic connection setup is incomplete in this review candidate; a working public connection must be delivered before submission.
4. Give permission for cloud connections, then connect your Picsart account. Review the quoted price before any generation. Payments take place on picsart.com.

== Frequently Asked Questions ==
= Do I receive extra credits for installing the plugin? =
No. Connect your existing Picsart account or create one on Picsart.com. The plugin uses the actual balance supplied by Picsart, including any account-level free credits. Installing, reinstalling or connecting another site does not issue extra credits. Review each generation price; free credits may not cover a video. You can upgrade to Pro or Ultra or manage credits on Picsart.com.

= Will my original image be replaced? =
No. Local edits create a new attachment. Applying it to a post or product is explicit. Restore is allowed only while the destination still matches the recorded change.

= Can I use watermarks in product feeds? =
Use clean images for product listings and feeds. The plugin blocks applying marked copies to product destinations. Review each marketplace's image rules. A visible watermark does not prevent copying.

= Does it work without WooCommerce? =
The local Media Library tools work without WooCommerce. Product discovery and product-specific placement require WooCommerce. Standard block and shortcode media placement are also available. Eleven collection layouts support up to 20 images/videos, presentation controls and accessible manual navigation. Private email/reminder drafts and HTML/ICS exports do not send campaigns or add external calendar events.

= Are browser exports identical to the source? =
Canvas and video exports can change encoding, colour profiles and embedded metadata. Keep the original. Do not assume an exported derivative preserves provenance metadata or is automatically eligible for a shopping feed.

= What happens on uninstall? =
Plugin preferences and capabilities are removed. Media attachments and authored content are retained. Disconnect Picsart and revoke service authorization separately; removing a WordPress plugin does not delete your Picsart account or cloud files.

== Screenshots ==
1. Picsart workspace navigation and generation updates.
2. Review an original image beside its generated video, then accept or reject the result.
3. A generated image saved to the WordPress Media Library.
4. Choose video style, model, duration and resolution, and review the generation price.
5. Generate an image from a text description.
6. Choose a source photo from uploads, the WordPress Media Library or Picsart Drive.
7. Connected Picsart account settings, credit balance and support links.

== Changelog ==

= 1.1.2 =
* Restored account-OAuth background removal and enhancement with exact credit quotes, explicit approval and result review; the shared-key adapter remains removed.
* Create images from text without a reference photo.
* Support Seedance 2.5 lower-resolution drafts while keeping Full HD as the default.
* Recover existing generation results after polling interruptions without submitting again.
* Clarify reviewed media destinations and link to Picsart Drive.
= 1.1.1 =
* Added server-configured background removal and AI upscale, encrypted operation receipts and output validation.
* Added model sync/defaults, OAuth recovery, prompt normalization and explicit result acceptance/regeneration.
* Added opt-in status emails, private marketing drafts, linked banner and calendar exports.
* Added eleven native media collection presets and improved blog, image application and restore workflows.
* Fixed nonce navigation and receipt cleanup warnings from Plugin Check.

= 1.1.0 =
* Added local image-copy editing and secure destination apply/restore.
* Updated account-connected cloud studio, recipes, history and exports.
* Added per-user cloud consent, onboarding and notification controls.
* Included readable browser source and a clean distribution manifest.
