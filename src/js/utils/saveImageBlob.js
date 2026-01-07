/**
 * Utility function for saving image blob to WordPress media library.
 */

/**
 * Extracts file extension from filename or URL.
 *
 * @param {string} filename - Filename or URL
 * @returns {string} File extension (e.g., 'jpg', 'png', 'webp') or 'jpg' as fallback
 */
const getFileExtension = (filename) => {
	if (!filename) return 'jpg';

	// Remove query parameters if it's a URL
	const cleanFilename = filename.split('?')[0];

	// Extract extension
	const match = cleanFilename.match(/\.([a-zA-Z0-9]+)$/);
	if (match && match[1]) {
		const ext = match[1].toLowerCase();
		// Common image extensions
		const validExtensions = [
			'jpg',
			'jpeg',
			'png',
			'gif',
			'webp',
			'bmp',
			'svg',
		];
		return validExtensions.includes(ext) ? ext : 'jpg';
	}

	return 'jpg'; // fallback
};

/**
 * Saves image blob to WordPress media library.
 *
 * @param {Blob} blob - The image blob from Picsart SDK
 * @param {Object} options - Additional options
 * @param {string} options.postId - Post ID to assign as featured image
 * @param {string} options.termId - Term ID to assign as term thumbnail
 * @param {string} options.originalFilename - Original filename for naming
 * @param {string} options.originalUrl - Original image URL for naming
 * @returns {Promise<Object>} Promise that resolves with the save result
 */
export const saveImageBlob = async (blob, options = {}) => {
	try {
		// Validate blob
		if (!blob || !(blob instanceof Blob) || blob.size === 0) {
			throw new Error('Invalid blob data');
		}

		// Get WordPress globals
		if (!window.PICSART) {
			throw new Error('PICSART globals not available');
		}

		const { REST_URL, REST_NONCE } = window.PICSART;

		// Determine file extension from original filename or URL
		const fileExtension = getFileExtension(
			options.originalFilename || options.originalUrl
		);
		const filename = `edited-image.${fileExtension}`;

		// Create FormData to send blob
		const formData = new FormData();
		formData.append('image', blob, filename);

		if (options.postId && options.postId !== 'null') {
			formData.append('post_id', options.postId);
		}

		if (options.termId && options.termId !== 'null') {
			formData.append('term_id', options.termId);
		}

		if (options.originalFilename) {
			formData.append('original_filename', options.originalFilename);
		}

		if (options.originalUrl) {
			formData.append('original_url', options.originalUrl);
		}

		// Send to WordPress REST API
		const response = await fetch(`${REST_URL}/save-blob`, {
			method: 'POST',
			headers: {
				'X-WP-Nonce': REST_NONCE,
			},
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.status === 'success') {
			console.log('Image saved successfully:', result.result);
			return result;
		} else {
			throw new Error(result.message || 'Failed to save image');
		}
	} catch (error) {
		console.error('Error saving image:', error);
		throw error;
	}
};

/**
 * Shows success message and optionally reloads the page.
 *
 * @param {Object} result - The save result from saveImageBlob
 * @param {Object} options - Options for post-save actions
 * @param {string} options.postId - Post ID (if provided, page will reload)
 * @param {string} options.termId - Term ID (if provided, page will reload)
 * @param {boolean} options.showAlert - Whether to show alert message (default: true)
 * @param {number} options.reloadDelay - Delay before reload in ms (default: 1000)
 * @param {string} options.blockId - Block ID for Gutenberg block updates
 */
export const handleSaveSuccess = (result, options = {}) => {
	const {
		postId,
		termId,
		showAlert = false,
		reloadDelay = 250,
		blockId,
		onClose,
	} = options;

	if (showAlert) {
		alert('Image saved successfully to media library!');
	}

	// Check if this is for a Gutenberg block (blockId exists)
	if (blockId && result?.result) {
		// Close SDK modal only in Gutenberg context
		if (onClose && typeof onClose === 'function') {
			// Small delay to ensure any UI updates are processed
			setTimeout(() => {
				onClose();
			}, 100);
		}

		// Emit custom event for Gutenberg block update
		const event = new CustomEvent('picsart:image-updated', {
			detail: {
				blockId,
				newImageData: result.result,
			},
		});
		document.dispatchEvent(event);

		// Don't reload page for Gutenberg blocks
		return;
	}

	// If we have onClose (SDK Editor) but no blockId (not Gutenberg),
	// we need to handle Media Library modal + SDK modal scenario
	if (onClose && typeof onClose === 'function') {
		// Import closeMediaLibraryModal dynamically to avoid circular imports
		import('../utils/picsart-helpers.js').then(
			({ closeMediaLibraryModal }) => {
				// Close Media Library modal first (if it exists)
				closeMediaLibraryModal();

				// Then close SDK modal after a small delay
				setTimeout(() => {
					onClose();
				}, 100);

				// Reload page to show the updated image and success notice
				setTimeout(() => {
					window.location.reload();
				}, 400);
			}
		);
		return;
	}

	// Optionally reload the page to show updated image
	if (postId || termId) {
		setTimeout(() => {
			window.location.reload();
		}, reloadDelay);
	}
};

/**
 * Shows error message to user.
 *
 * @param {Error} error - The error that occurred
 * @param {boolean} showAlert - Whether to show alert message (default: true)
 */
export const handleSaveError = (error, showAlert = false) => {
	if (showAlert) {
		alert('Failed to save image: ' + error.message);
	}
};

/**
 * Handles export output from Picsart SDK and extracts valid blob.
 *
 * @param {Object} output - The export output from SDK
 * @returns {Blob|null} Valid blob if found, null otherwise
 */
export const extractBlobFromSDKOutput = (output) => {
	// Check if imageData is a valid Blob
	if (
		output.data?.imageData &&
		output.data.imageData instanceof Blob &&
		output.data.imageData.size > 0
	) {
		console.log('output:', output);
		return output.data.imageData;
	}

	console.error('Invalid imageData received:', output.data?.imageData);

	return null;
};

/**
 * Complete handler for SDK export - extracts blob and saves it.
 *
 * @param {Object} output - The export output from SDK
 * @param {Object} saveOptions - Options for saving the blob
 * @returns {Promise<void>}
 */
export const handleSDKExport = async (output, saveOptions) => {
	const blob = extractBlobFromSDKOutput(output);

	if (!blob) {
		handleSaveError(
			new Error(
				'No valid image data received from editor. Please try again.'
			),
			false
		);
		return;
	}

	try {
		const result = await saveImageBlob(blob, saveOptions);
		handleSaveSuccess(result, {
			postId: saveOptions.postId,
			termId: saveOptions.termId,
			blockId: saveOptions.blockId,
			onClose: saveOptions.onClose,
		});
	} catch (error) {
		handleSaveError(error);
	}
};
