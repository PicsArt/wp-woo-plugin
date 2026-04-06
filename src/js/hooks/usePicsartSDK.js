/**
 * Custom hook for handling Picsart SDK initialization and export logic.
 */

import { useEffect } from 'react';

/**
 * Hook for managing Picsart SDK instance and export handling.
 *
 * @param {string} imageURL - URL of the image to edit
 * @param {Function} onExport - Callback function when export is completed
 * @returns {void}
 */
export const usePicsartSDK = (imageURL, onExport) => {
	useEffect(() => {
		if (!window.Picsart || !window.PICSART) {
			console.error(
				'Picsart SDK or PICSART data object is not available.'
			);
			return;
		}

		const { AJAX_URL, PROPERTY_ID, API_KEY, CUSTOMER_ID, PROXY_NONCE } =
			window.PICSART;

		// Initialize Picsart SDK instance
		const PicsartInstance = new window.Picsart({
			propertyId: PROPERTY_ID,
			apiKey: API_KEY,
			customerId: CUSTOMER_ID,
			containerId: 'picsart-editor-sdk',
			exportType: 'blob',
			mode: 'image',
		});

		// Set up event handlers
		PicsartInstance.onOpen(() => {
			console.log('Editor SDK for Web is ready to use!');
		});

		PicsartInstance.onError((error) => {
			console.log('SDK ERROR: ', error);
		});

		// Handle export
		PicsartInstance.onExport(onExport);

		// Prepare and open the image
		const finalImageURL = `${AJAX_URL}?action=picsart_proxy&nonce=${PROXY_NONCE}&url=${encodeURIComponent(imageURL)}`;

		PicsartInstance.open({
			imageUrl: finalImageURL,
		});
	}, [imageURL, onExport]);
};
