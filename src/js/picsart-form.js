import { showLoader, getLoadingMessage } from './loader.js';
import { closeMediaLibraryModal } from './utils/picsart-helpers.js';

const initPicsartForm = (form) => {
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		event.stopPropagation();
		const clickedButton = event.submitter;

		// Get operation name for loading message
		const plugin = clickedButton.getAttribute('data-picsart-plugin');
		const operationMessage = getLoadingMessage(plugin);

		// Show loader
		showLoader(operationMessage);

		fetch(`${PICSART.REST_URL}/convert`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': PICSART.REST_NONCE,
			},
			body: JSON.stringify({
				plugin: clickedButton.getAttribute('data-picsart-plugin'),
				image_url: clickedButton.getAttribute('data-picsart-image-url'),
				post_id: clickedButton.getAttribute('data-picsart-post-id'),
				term_id: clickedButton.getAttribute('data-picsart-term-id'),
				upscale_factor: clickedButton.getAttribute(
					'data-picsart-upscale'
				),
			}),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				console.log(data);

				// Close Media Library modal if it exists, then reload page
				closeMediaLibraryModal();

				// Reload page - admin notice will be shown automatically for both success and errors
				window.location.reload();
			})
			.catch((error) => {
				console.error(
					'An error occurred while downloading data',
					error
				);

				// Close Media Library modal if it exists, then reload page
				closeMediaLibraryModal();

				// Only for network errors - reload page to show any server-side notices
				window.location.reload();
			});
	});
};

export default initPicsartForm;
