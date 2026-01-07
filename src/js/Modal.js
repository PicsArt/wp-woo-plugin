import { useEffect, useState } from '@wordpress/element';

/**
 * The Modal Component.
 *
 * @param {object}   props                  Component props.
 * @param {string}   props.size             The size of the modal ('default' or 'full').
 * @param {Function} props.ContentComponent The component to render inside the modal.
 * @param {string}   props.imageURL         The URL of the image to display in the modal.
 * @param {Function} props.onClose          Function to call when the modal should close.
 * @param {object}   extraProps             Additional props to pass to ContentComponent.
 *
 * @return {JSX.Element}                    The modal component.
 */
export default function Modal({
	size,
	ContentComponent,
	imageURL,
	onClose,
	...extraProps
}) {
	const [isClosing, setIsClosing] = useState(false);

	// Add a class to the body to prevent scrolling when the modal is open.
	useEffect(() => {
		document.body.classList.add('picsart-modal-open');

		// Cleanup function to remove the class on unmount.
		return () => {
			document.body.classList.remove('picsart-modal-open');
		};
	}, []);

	const handleClose = () => {
		setIsClosing(true);
		// Allow time for closing animation before calling the parent close handler.
		setTimeout(() => {
			onClose();
		}, 300); // Must match the animation duration in CSS.
	};

	const modalClasses = [
		'picsart-modal',
		`picsart-modal--${size}`,
		isClosing ? 'is-closing' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={modalClasses}>
			<div
				className="picsart-modal__backdrop"
				onClick={handleClose}
			></div>
			<div className="picsart-modal__content-wrapper">
				<div className="picsart-modal__content">
					<button
						className="picsart-modal__close-button"
						onClick={handleClose}
					>
						&times;
					</button>

					{ContentComponent ? (
						<ContentComponent
							imageURL={imageURL}
							onClose={handleClose}
							{...extraProps}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
