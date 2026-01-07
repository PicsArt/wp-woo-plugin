import initPicsartForm from './picsart-form';
import { showLoader, getLoadingMessage } from './loader.js';
import {
	handlePicsartAPIActionForFeaturedImage,
	handlePicsartEditorForFeaturedImage,
	closeMediaLibraryModal,
} from './utils/picsart-helpers.js';

(function () {
	// Show WordPress-style admin notice
	const showAdminNotice = (message, type = 'error') => {
		// Remove existing notices
		const existingNotices = document.querySelectorAll(
			'.picsart-temp-notice'
		);
		existingNotices.forEach((notice) => notice.remove());

		const notice = document.createElement('div');
		notice.className = `notice notice-${type} is-dismissible picsart-temp-notice`;
		notice.innerHTML = `<p>${message}</p><button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss this notice.</span></button>`;

		// Add to the page
		const headerEnd = document.querySelector('.wp-header-end');
		if (headerEnd) {
			headerEnd.insertAdjacentElement('afterend', notice);
		}

		// Handle dismiss button
		const dismissButton = notice.querySelector('.notice-dismiss');
		if (dismissButton) {
			dismissButton.addEventListener('click', () => {
				notice.remove();
			});
		}

		// Auto-dismiss after 5 seconds
		setTimeout(() => {
			if (notice.parentNode) {
				notice.remove();
			}
		}, 5000);
	};
	const addPicsartFields = (view) => {
		if (view.el.querySelector('[data-setting="picsart"]')) return;

		const fileUrlSetting = view.el.querySelector('[data-setting="url"]');
		if (!fileUrlSetting) return;

		const wrapper = document.createElement('span');
		wrapper.className = 'setting';
		wrapper.dataset.setting = 'picsart';

		const label = document.createElement('div');
		label.className = 'name';
		label.setAttribute('for', 'attachment-details-picsart-field');
		label.textContent = 'Picsart';

		const form_picsart = document.createElement('form');
		form_picsart.className = 'value';
		form_picsart.dataset.picsartForm = '';

		const imageUrl = view.model.get('url');
		form_picsart.innerHTML = picsart_admin_data.form.join('');

		wrapper.appendChild(label);
		wrapper.appendChild(form_picsart);
		fileUrlSetting.insertAdjacentElement('afterend', wrapper);

		form_picsart
			.querySelectorAll('[data-picsart-image-url]')
			.forEach((btn) => {
				btn.setAttribute('data-picsart-image-url', imageUrl);
			});

		initPicsartForm(form_picsart);

		// Initialize any other Picsart forms on the page
		document
			.querySelectorAll('[data-picsart-form]:not(.picsart-initialized)')
			.forEach((form) => {
				form.classList.add('picsart-initialized');
				initPicsartForm(form);
			});
	};

	const tryPatchMediaView = () => {
		const DetailsView = wp?.media?.view?.Attachment?.Details?.TwoColumn;

		if (!DetailsView) {
			setTimeout(tryPatchMediaView, 250);
			return;
		}

		const originalRender = DetailsView.prototype.render;

		DetailsView.prototype.render = function () {
			const result = originalRender.apply(this, arguments);
			addPicsartFields(this);
			return result;
		};
	};

	// Initialize all existing Picsart forms when script loads
	const initAllPicsartForms = () => {
		document
			.querySelectorAll('[data-picsart-form]:not(.picsart-initialized)')
			.forEach((form) => {
				form.classList.add('picsart-initialized');
				initPicsartForm(form);
			});
	};

	// Handle featured image buttons in Gutenberg editor
	const initFeaturedImageButtons = () => {
		document.addEventListener('click', (e) => {
			const button = e.target.closest(
				'[data-picsart-plugin], [data-picsart-method="editor"]'
			);
			if (!button) return;

			// Only handle buttons inside .picsart-feature-image
			if (!button.closest('.picsart-feature-image')) return;

			e.preventDefault();
			e.stopPropagation();

			const plugin = button.getAttribute('data-picsart-plugin');
			const method = button.getAttribute('data-picsart-method');
			const imageUrl = button.getAttribute('data-picsart-image-url');
			const postId = button.getAttribute('data-picsart-post-id');
			const upscaleLevel = button.getAttribute('data-picsart-upscale');

			if (!imageUrl || imageUrl === '#') {
				return;
			}

			if (method === 'editor') {
				handlePicsartEditorForFeaturedImage(imageUrl, postId);
			} else if (plugin) {
				handlePicsartAPIActionForFeaturedImage(
					plugin,
					imageUrl,
					upscaleLevel,
					postId
				);
			}
		});
	};

	// Handle list view buttons (not in forms)
	const initListViewButtons = () => {
		// Handle direct buttons with Picsart attributes
		document.addEventListener('click', (e) => {
			const button = e.target.closest('[data-picsart-plugin]');
			if (!button) return;

			// Skip if this button is inside a form or featured image container (handled separately)
			if (button.closest('[data-picsart-form]')) return;

			e.preventDefault();

			// Get attributes from button
			const plugin = button.getAttribute('data-picsart-plugin');
			const imageUrl = button.getAttribute('data-picsart-image-url');
			const postId = button.getAttribute('data-picsart-post-id');
			const upscaleFactor = button.getAttribute('data-picsart-upscale');

			// Only handle API calls (not editor)
			if (!plugin) {
				const message =
					typeof picsart_admin_data !== 'undefined' &&
					picsart_admin_data.messages?.no_plugin_specified
						? picsart_admin_data.messages.no_plugin_specified
						: 'No operation specified. Please try again.';
				showAdminNotice(message, 'error');
				return;
			}

			if (!imageUrl) {
				const message =
					typeof picsart_admin_data !== 'undefined' &&
					picsart_admin_data.messages?.invalid_image_url
						? picsart_admin_data.messages.invalid_image_url
						: 'Invalid image URL. Please try again.';
				showAdminNotice(message, 'error');
				return;
			}

			if (imageUrl === 'null') {
				const message =
					typeof picsart_admin_data !== 'undefined' &&
					picsart_admin_data.messages?.no_featured_image
						? picsart_admin_data.messages.no_featured_image
						: 'This post does not have a featured image. Please set a featured image first.';
				showAdminNotice(message, 'error');
				return;
			}

			// Get operation name for loading message
			const operationMessage = getLoadingMessage(plugin);

			// Show loader
			showLoader(operationMessage);

			// Make the API call
			fetch(`${PICSART.REST_URL}/convert`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': PICSART.REST_NONCE,
				},
				body: JSON.stringify({
					plugin: plugin,
					image_url: imageUrl,
					post_id: postId,
					upscale_factor: upscaleFactor,
				}),
			})
				.then((response) => {
					if (!response.ok) {
						throw new Error(
							`HTTP error! status: ${response.status}`
						);
					}
					return response.json();
				})
				.then((data) => {
					console.log(data);

					// Close Media Library modal if it exists, then reload page
					closeMediaLibraryModal();

					// Keep loader while reloading
					// Reload page - admin notice will be shown automatically
					window.location.reload();
				})
				.catch((error) => {
					console.error(
						'An error occurred while downloading data',
						error
					);

					// Close Media Library modal if it exists, then reload page
					closeMediaLibraryModal();

					// Keep loader while reloading
					// Reload page to show any server-side notices
					window.location.reload();
				});
		});
	};

	// Start checking when DOM is ready
	if (
		document.readyState === 'complete' ||
		document.readyState === 'interactive'
	) {
		tryPatchMediaView();
		initAllPicsartForms();
		initListViewButtons();
		initFeaturedImageButtons();
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			tryPatchMediaView();
			initAllPicsartForms();
			initListViewButtons();
			initFeaturedImageButtons();
		});
	}
})();
