const { addFilter } = wp.hooks;
const { BlockControls } = wp.blockEditor;
const { ToolbarGroup, ToolbarDropdownMenu } = wp.components;
const { createHigherOrderComponent } = wp.compose;
const { __ } = wp.i18n;

import SygnetDarkIcon from './../../assets/icons/picsart-sygnet-dark.jsx';
import {
	generateBlockId,
	handlePicsartAPIAction,
	handlePicsartEditor,
} from './utils/picsart-helpers.js';

/**
 * Higher-Order Component to add a custom dropdown menu to the Image block toolbar.
 */
const picsartImageToolbarButton = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		if (props.name !== 'core/image') {
			return <BlockEdit {...props} />;
		}

		const { isSelected, attributes, setAttributes } = props;
		const imageUrl = attributes?.url;

		// Only show dropdown if image exists
		if (!isSelected || !imageUrl) {
			return <BlockEdit {...props} />;
		}

		// Generate unique block identifier
		const blockId = generateBlockId();

		const handlePicsartAction = async (action, upscaleLevel = null) => {
			await handlePicsartAPIAction(
				action,
				imageUrl,
				upscaleLevel,
				setAttributes,
				blockId
			);
		};

		const openEditor = () => {
			handlePicsartEditor(imageUrl, setAttributes, blockId);
		};

		const dropdownControls = [
			[
				{
					title: __('Edit with Picsart', 'picsart-ai-image-editor'),
					icon: SygnetDarkIcon,
					onClick: openEditor,
				},
			],
			[
				{
					title: __('Remove Background', 'picsart-ai-image-editor'),
					icon: 'admin-appearance',
					onClick: () => handlePicsartAction('remove_bg'),
				},
			],
			[
				{
					title: __('Upscale 2x', 'picsart-ai-image-editor'),
					icon: 'editor-expand',
					onClick: () => handlePicsartAction('upscale_image', '2x'),
				},
				{
					title: __('Upscale 4x', 'picsart-ai-image-editor'),
					icon: 'editor-expand',
					onClick: () => handlePicsartAction('upscale_image', '4x'),
				},
				{
					title: __('Upscale 8x', 'picsart-ai-image-editor'),
					icon: 'editor-expand',
					onClick: () => handlePicsartAction('upscale_image', '8x'),
				},
			],
		];

		return (
			<>
				<BlockEdit {...props} />
				{isSelected && (
					<BlockControls>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={SygnetDarkIcon}
								label={__(
									'Picsart Tools',
									'picsart-ai-image-editor'
								)}
								controls={dropdownControls}
							/>
						</ToolbarGroup>
					</BlockControls>
				)}
			</>
		);
	};
}, 'picsartImageToolbarButton');

addFilter(
	'editor.BlockEdit',
	'picsart-tools/add-image-toolbar-button',
	picsartImageToolbarButton
);
