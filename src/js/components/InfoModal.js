/**
 * Info Modal Component for displaying informational messages.
 *
 * @param {Object} props Component props.
 * @param {string} props.title The title of the modal.
 * @param {string} props.message The message to display.
 * @param {Function} props.onClose Function to call when closing the modal.
 * @return {JSX.Element} The info modal component.
 */
export default function InfoModal({ title = 'Information', message, onClose }) {
	return (
		<div className="picsart-info-modal">
			<div className="picsart-info-modal__header">
				<h3 className="picsart-info-modal__title">{title}</h3>
			</div>
			<div className="picsart-info-modal__body">
				<p className="picsart-info-modal__message">{message}</p>
			</div>
			<div className="picsart-info-modal__footer">
				<button
					className="picsart-info-modal__button"
					onClick={onClose}
				>
					OK
				</button>
			</div>
		</div>
	);
}
