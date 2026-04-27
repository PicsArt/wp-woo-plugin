import { createRoot } from 'react-dom/client';
import Modal from './Modal';
import SDKEditor from './components/SDKEditor';
import InfoModal from './components/InfoModal';

const MODAL_CONTENTS = {
	editor: SDKEditor,
	info: InfoModal,
};

document.addEventListener('DOMContentLoaded', () => {
	const modalRootElement = document.getElementById('picsart-modal-root');
	if (!modalRootElement) {
		return;
	}

	const root = createRoot(modalRootElement);

	const openModal = (method, size, imageURL, extraProps = {}) => {
		const ContentComponent = MODAL_CONTENTS[method];

		root.render(
			<Modal
				size={size}
				ContentComponent={ContentComponent}
				imageURL={imageURL}
				{...extraProps}
				onClose={() => root.render(null)}
			/>
		);
	};

	const showInfoModal = (title, message) => {
		openModal('info', 'default', '', { title, message });
	};

	document.body.addEventListener('click', (event) => {
		const trigger = event.target.closest('[data-picsart-method]');
		const pluginTrigger = event.target.closest('[data-picsart-plugin]');

		// Handle method triggers (open modal)
		if (trigger) {
			event.preventDefault();

			const method = trigger.dataset.picsartMethod;
			const size = trigger.dataset.picsartSize || 'default';
			const imageURL = trigger.dataset.picsartImageUrl || '';
			const postId = trigger.dataset.picsartPostId || '';
			const termId = trigger.dataset.picsartTermId || '';
			const blockId = trigger.dataset.picsartBlockId || '';

			if (!MODAL_CONTENTS[method]) {
				console.error(
					`No modal content component found for method: ${method}`
				);
				return;
			}

			if (!imageURL || imageURL === 'null') {
				console.error('No image URL found for modal');
				showInfoModal(
					'No Image Found',
					'No image URL found for the editor.'
				);
				return;
			}

			// Extract original filename from imageURL if possible
			let originalFilename = '';
			try {
				const url = new URL(imageURL);
				originalFilename = url.pathname.split('/').pop() || '';
			} catch (e) {
				// If URL parsing fails, leave originalFilename empty
			}

			// Pass contextual data to the modal
			const extraProps = {
				postId,
				termId,
				originalFilename,
				blockId,
			};

			openModal(method, size, imageURL, extraProps);
			return;
		}

		// Handle plugin triggers (API calls) - prevent default form submission
		if (pluginTrigger) {
			event.preventDefault();
			// The actual API call will be handled by the form submit handler
			// We just need to trigger the form submission programmatically
			const form = pluginTrigger.closest('[data-picsart-form]');
			if (form) {
				// Create a custom submit event with the clicked button as submitter
				const submitEvent = new SubmitEvent('submit', {
					bubbles: true,
					cancelable: true,
					submitter: pluginTrigger,
				});
				form.dispatchEvent(submitEvent);
			}
			return;
		}
	});
});
