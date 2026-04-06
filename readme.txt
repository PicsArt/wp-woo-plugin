=== Picsart AI Image Editor ===
Contributors: picsartenterprise
Tags: image editor, ai, background removal, upscale, woocommerce
Requires at least: 6.3
Tested up to: 6.9
Stable tag: 1.0.5
Requires PHP: 7.4
License: MIT
License URI: https://opensource.org/licenses/MIT

AI-powered image editing for WordPress. Edit, remove backgrounds, and upscale images directly from your dashboard.

== Description ==

Picsart AI Image Editor is a powerful WordPress plugin that brings advanced AI image editing tools directly into your WordPress dashboard. Whether you manage a WooCommerce store, a blog, or a portfolio, you can edit, enhance, and transform images without leaving WordPress.

**Key Features:**

* **AI Image Editor** - Open the full Picsart editor to crop, retouch, add filters, and more.
* **Background Removal** - Remove image backgrounds instantly with AI. Choose from transparent, white, black, or custom colors.
* **Image Upscaling** - Upscale images by 2x, 4x, or 8x while preserving quality.
* **Gutenberg Integration** - Edit images directly from the block editor toolbar.
* **Media Library Support** - Access Picsart tools from your WordPress media library.
* **Featured Image Editing** - Edit featured images with one click.
* **WooCommerce Ready** - Seamlessly integrates with WooCommerce product images.
* **Watermark Support** - Add watermarks to your product images with configurable corner radius.
* **Category/Taxonomy Images** - Edit images assigned to categories and custom taxonomies.

**How It Works:**

1. Install the plugin and enter your Picsart API credentials in Settings.
2. Navigate to any image in the block editor, media library, or featured image panel.
3. Click "Edit with Picsart", "Remove Background", or "Upscale Image".
4. The processed image is automatically saved to your media library.

**Requirements:**

* A Picsart API key, Property ID, and Customer ID. Sign up at [Picsart](https://console.picsart.io/).

== Third-Party Services ==

This plugin connects to external services provided by Picsart to deliver its image editing features. By using this plugin, data is sent to the following services:

**Picsart API (api.picsart.io)**
Used for AI image processing including background removal and image upscaling. Image URLs are sent to the API for processing.

* [Picsart Terms of Service](https://picsart.com/terms-and-conditions)
* [Picsart Privacy Policy](https://picsart.com/privacy-policy)

**Picsart SDK (sdk.picsart.io)**
The Picsart Editor SDK is loaded from the Picsart CDN to provide the in-browser image editing experience.

* [Picsart Terms of Service](https://picsart.com/terms-and-conditions)
* [Picsart Privacy Policy](https://picsart.com/privacy-policy)

== Installation ==

1. Upload the plugin folder to the `/wp-content/plugins/` directory, or install directly through the WordPress plugin screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Go to **Picsart Editor** (or **WooCommerce > Picsart Editor** if WooCommerce is active) to configure your API credentials.
4. Enter your Picsart API Key, Property ID, and Customer ID.
5. Start editing images from the block editor, media library, or featured image panel.

== Frequently Asked Questions ==

= Where do I get my Picsart API credentials? =

You can obtain your API Key, Property ID, and Customer ID by signing up at [Picsart Console](https://console.picsart.io/).

= Does this plugin work without WooCommerce? =

Yes. The plugin works with any WordPress site. When WooCommerce is active, the settings page appears under the WooCommerce menu. Otherwise, it appears as a top-level menu item.

= What image formats are supported? =

The plugin supports JPEG, PNG, WebP, GIF, and BMP formats.

= Are my images sent to external servers? =

Yes. Images are sent to the Picsart API for AI processing (background removal, upscaling). The processed images are then saved back to your WordPress media library. Please review the Third-Party Services section for details.

== Changelog ==

= 1.0.5 =
* Added Customer ID to plugin settings.
* Improved build process.

= 1.0.0 =
* Initial release.
* AI image editor with Picsart SDK integration.
* Background removal with customizable background colors.
* Image upscaling (2x, 4x, 8x).
* Gutenberg block editor integration.
* Media library integration.
* Featured image editing support.
* WooCommerce product image support.
* Category and taxonomy image editing.
* Watermark support with configurable corner radius.
* Admin settings page for API credentials and image options.

== Upgrade Notice ==

= 1.0.5 =
Added Customer ID setting for improved API authentication.

= 1.0.0 =
Initial release of Picsart AI Image Editor.
