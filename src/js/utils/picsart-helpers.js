import { showLoader, hideLoader, getLoadingMessage } from '../loader.js';

/**
 * Helper functions for Picsart plugin
 */
const { dispatch } = wp.data;

/**
 * Close Media Library modal if it exists
 * @returns {boolean} True if modal was found and closed
 */
export const closeMediaLibraryModal = () => {
	const closeButton = document.querySelector('.media-modal-close');
	if (closeButton) {
		closeButton.click();
		return true;
	}
	return false;
};

/**
 * Close Picsart SDK modal if it exists
 * @returns {boolean} True if modal was found and closed
 */
export const closeSDKModal = () => {
	const closeButton = document.querySelector('.picsart-modal__close-button');
	if (closeButton) {
		closeButton.click();
		return true;
	}
	return false;
};

/**
 * Show WordPress admin notice
 * @param {string} message - Message to display
 * @param {string} status - Notice status (success, error, info, warning)
 * @param {Object} options - Additional options
 * @param {boolean} options.isDismissible - Whether notice can be dismissed (default: true)
 * @param {boolean} options.autoRemove - Whether notice should auto-remove after 5s (default: true)
 * @returns {string} Notice ID for manual removal
 */
export const showNotice = (message, status = 'success', options = {}) => {
	const noticeId = 'picsart-notice-' + Date.now();
	const isDismissible = options.isDismissible !== false; // Default to true
	const autoRemove = options.autoRemove !== false; // Default to true

	dispatch('core/notices').createNotice(status, message, {
		id: noticeId,
		isDismissible,
	});

	// Auto-remove after 5 seconds (unless disabled)
	if (autoRemove) {
		setTimeout(() => {
			dispatch('core/notices').removeNotice(noticeId);
		}, 5000);
	}

	return noticeId; // Return notice ID so it can be manually removed
};

/**
 * Get human-readable action name
 * @param {string} action - Action type (remove_bg, upscale_image, etc)
 * @param {string} upscaleLevel - Upscale level (2x, 4x, 8x)
 * @returns {string} Human-readable action name
 */
export const getActionName = (action, upscaleLevel) => {
	switch (action) {
		case 'remove_bg':
			return 'Background removal';
		case 'upscale_image':
			return `Image upscaling (${upscaleLevel})`;
		default:
			return 'Image processing';
	}
};

/**
 * Create event listener for block image updates
 * @param {string} blockId - Unique block identifier
 * @param {Function} setAttributes - Block's setAttributes function
 * @param {string} successMessage - Success message to display
 * @param {string|null} processingNoticeId - ID of processing notice to remove
 * @returns {Function} Event listener function
 */
export const createBlockImageUpdateListener = (
	blockId,
	setAttributes,
	successMessage
) => {
	const listener = (event) => {
		if (event.detail?.blockId === blockId && event.detail?.newImageData) {
			// Hide loader
			hideLoader();

			const { image_id, image_url, body } = event.detail.newImageData;

			// Use processed image URL (body) if available, fallback to image_url
			const newImageUrl = body || image_url;

			// Update block attributes with new image
			setAttributes({
				id: image_id,
				url: newImageUrl,
			});

			// Show success message
			showNotice(successMessage);

			// Remove listener after use
			document.removeEventListener('picsart:image-updated', listener);
		}
	};
	return listener;
};

/**
 * Generate unique block ID
 * @returns {string} Unique block identifier
 */
export const generateBlockId = () => {
	return `picsart-block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Handle Picsart API action for blocks
 * @param {string} action - Action type (remove_bg, upscale_image)
 * @param {string} imageUrl - Image URL to process
 * @param {string|null} upscaleLevel - Upscale level (2x, 4x, 8x)
 * @param {Function} setAttributes - Block's setAttributes function
 * @param {string} blockId - Unique block identifier
 * @returns {Promise<void>}
 */
export const handlePicsartAPIAction = async (
	action,
	imageUrl,
	upscaleLevel,
	setAttributes,
	blockId
) => {
	const actionName = getActionName(action, upscaleLevel);

	// Show loader
	showLoader(getLoadingMessage(action));

	// Set up event listener for when image is saved
	const handleImageUpdate = createBlockImageUpdateListener(
		blockId,
		setAttributes,
		`${actionName} completed successfully! Image has been updated.`
	);

	document.addEventListener('picsart:image-updated', handleImageUpdate);

	try {
		// Get WordPress globals
		if (!window.PICSART) {
			throw new Error('PICSART globals not available');
		}

		const { REST_URL, REST_NONCE } = window.PICSART;

		// Prepare request data
		const requestData = {
			plugin: action,
			image_url: imageUrl,
			post_id: 'null',
			context: 'gutenberg', // Add context to prevent admin notices
		};

		if (upscaleLevel) {
			requestData.upscale_factor = upscaleLevel;
		}

		// Call the convert API
		const response = await fetch(`${REST_URL}/convert`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': REST_NONCE,
			},
			body: JSON.stringify(requestData),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Server error (${response.status}): ${errorText || response.statusText}`
			);
		}

		const result = await response.json();

		if (result.status === 'success' && result.result) {
			// Emit custom event for block update - same as in handleSaveSuccess
			const event = new CustomEvent('picsart:image-updated', {
				detail: {
					blockId,
					newImageData: result.result,
				},
			});
			document.dispatchEvent(event);
		} else {
			throw new Error(result.message || 'Failed to process image');
		}
	} catch (error) {
		console.error('Error processing image:', error);

		// Hide loader on error
		hideLoader();

		// Show error message
		showNotice(`${actionName} failed: ${error.message}`, 'error');

		// Remove event listener in case of error
		document.removeEventListener(
			'picsart:image-updated',
			handleImageUpdate
		);
	}
};

/**
 * Handle opening Picsart editor for blocks
 * @param {string} imageUrl - Image URL to edit
 * @param {Function} setAttributes - Block's setAttributes function
 * @param {string} blockId - Unique block identifier
 */
export const handlePicsartEditor = (imageUrl, setAttributes, blockId) => {
	// Create a temporary button element with proper data attributes
	const button = document.createElement('button');
	button.setAttribute('data-picsart-method', 'editor');
	button.setAttribute('data-picsart-image-url', imageUrl);
	button.setAttribute('data-picsart-post-id', 'null');
	button.setAttribute('data-picsart-size', 'full');
	button.setAttribute('data-picsart-block-id', blockId);

	// Add to DOM temporarily, click, then remove
	button.style.display = 'none';
	document.body.appendChild(button);

	// Set up event listener for when image is saved
	const handleImageUpdate = createBlockImageUpdateListener(
		blockId,
		setAttributes,
		'Image editing completed successfully! Image has been updated.'
	);

	document.addEventListener('picsart:image-updated', handleImageUpdate);

	button.click();
	document.body.removeChild(button);
};

/**
 * Handle opening Picsart editor for the featured image
 * @param {string} imageUrl - Image URL to edit
 * @param {number} postId - Current Post ID
 */
export const handlePicsartEditorForFeaturedImage = (imageUrl, postId) => {
	// Create a temporary button element with proper data attributes
	const button = document.createElement('button');
	button.setAttribute('data-picsart-method', 'editor');
	button.setAttribute('data-picsart-image-url', imageUrl);
	button.setAttribute('data-picsart-post-id', postId);
	button.setAttribute('data-picsart-size', 'full');
	button.setAttribute('data-picsart-is-featured', 'true'); // Flag for featured image

	// Add to DOM temporarily, click, then remove
	button.style.display = 'none';
	document.body.appendChild(button);

	// Set up event listener for when image is saved
	const handleImageUpdate = createFeaturedImageUpdateListener(
		'Image editing completed successfully! Image has been updated.'
	);

	document.addEventListener('picsart:image-updated', handleImageUpdate);

	button.click();
	document.body.removeChild(button);
};

/**
 * Create event listener for featured image updates
 * @param {string} successMessage - Success message to display
 * @returns {Function} Event listener function
 */
export const createFeaturedImageUpdateListener = (successMessage) => {
	const listener = (event) => {
		// Only handle events that are NOT for blocks (no blockId)
		if (event.detail?.blockId) {
			return;
		}

		if (event.detail?.newImageData) {
			// Hide loader
			hideLoader();

			const { image_id } = event.detail.newImageData;

			// Update featured image
			dispatch('core/editor').editPost({ featured_media: image_id });

			// Show success message
			showNotice(successMessage);

			// Remove listener after use
			document.removeEventListener('picsart:image-updated', listener);
		}
	};
	return listener;
};

/**
 * Handle Picsart API action for the featured image
 * @param {string} action - Action type (remove_bg, upscale_image)
 * @param {string} imageUrl - Image URL to process
 * @param {string|null} upscaleLevel - Upscale level (2x, 4x, 8x)
 * @param {number} postId - Current Post ID
 * @returns {Promise<void>}
 */
export const handlePicsartAPIActionForFeaturedImage = async (
	action,
	imageUrl,
	upscaleLevel,
	postId
) => {
	const actionName = getActionName(action, upscaleLevel);

	// Show loader
	showLoader(getLoadingMessage(action));

	// Set up event listener for when image is saved
	const handleImageUpdate = createFeaturedImageUpdateListener(
		`${actionName} completed successfully! Image has been updated.`
	);

	document.addEventListener('picsart:image-updated', handleImageUpdate);

	try {
		// Get WordPress globals
		if (!window.PICSART) {
			throw new Error('PICSART globals not available');
		}

		const { REST_URL, REST_NONCE } = window.PICSART;

		// Prepare request data
		const requestData = {
			plugin: action,
			image_url: imageUrl,
			post_id: postId,
			context: 'gutenberg', // Add context to prevent admin notices
		};

		if (upscaleLevel) {
			requestData.upscale_factor = upscaleLevel;
		}

		// Call the convert API
		const response = await fetch(`${REST_URL}/convert`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': REST_NONCE,
			},
			body: JSON.stringify(requestData),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Server error (${response.status}): ${errorText || response.statusText}`
			);
		}

		const result = await response.json();

		if (result.status === 'success' && result.result) {
			// Emit custom event for update
			const event = new CustomEvent('picsart:image-updated', {
				detail: {
					newImageData: result.result,
				},
			});
			document.dispatchEvent(event);
		} else {
			throw new Error(result.message || 'Failed to process image');
		}
	} catch (error) {
		console.error('Error processing image:', error);

		// Hide loader on error
		hideLoader();

		// Show error message
		showNotice(`${actionName} failed: ${error.message}`, 'error');

		// Remove event listener in case of error
		document.removeEventListener(
			'picsart:image-updated',
			handleImageUpdate
		);
	}
};
