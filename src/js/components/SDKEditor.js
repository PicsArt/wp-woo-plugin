import { useCallback } from 'react';
import { usePicsartSDK, handleSDKExport } from '../utils';

export default function SDKEditor({
	imageURL,
	postId,
	termId,
	originalFilename,
	blockId,
	onClose,
}) {
	// Create save options object
	const saveOptions = {
		postId,
		termId,
		originalFilename,
		originalUrl: imageURL,
		blockId,
		onClose,
	};

	// Handle export from SDK
	const handleExport = useCallback(
		(output) => {
			handleSDKExport(output, saveOptions);
		},
		[saveOptions]
	);

	// Initialize Picsart SDK
	usePicsartSDK(imageURL, handleExport);

	return <div id="picsart-editor-sdk"></div>;
}
