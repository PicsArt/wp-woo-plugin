/**
 * Picsart Loader Module
 *
 * Handles loading state with spinner overlay
 */

/**
 * Shows loading overlay with spinner
 * @param {string} message - Loading message to display
 */
export const showLoader = (message = 'Processing...') => {
	// Remove existing loader if any
	hideLoader();

	const loader = document.createElement('div');
	loader.id = 'picsart-loader';
	loader.innerHTML = `
		<div class="picsart-loader-overlay">
			<div class="picsart-loader-content">
				<div class="picsart-spinner"></div>
				<p>${message}</p>
			</div>
		</div>
	`;

	document.body.appendChild(loader);
};

/**
 * Hides loading overlay
 */
export const hideLoader = () => {
	const loader = document.getElementById('picsart-loader');
	if (loader) {
		loader.remove();
	}
};

/**
 * Gets appropriate loading message for operation
 * @param {string} plugin - The plugin type (remove_bg, upscale_image, etc.)
 * @returns {string} Formatted loading message
 */
export const getLoadingMessage = (plugin) => {
	switch (plugin) {
		case 'remove_bg':
			return 'Removing background...';
		case 'upscale_image':
			return 'Upscaling image...';
		default:
			return 'Processing image...';
	}
};
