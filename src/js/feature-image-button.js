import { addFilter } from '@wordpress/hooks';
import { Fragment } from '@wordpress/element';

function enhanceFeaturedImage(OriginalComponent) {
	return (props) => {
		// Check if post has featured image.
		const hasImage =
			props?.media?.source_url && props.media.source_url !== '';

		const replaceAttributes = (html) => {
			if (!html || typeof html !== 'string') {
				return '';
			}
			return html
				.replaceAll(
					'data-picsart-image-url="#"',
					`data-picsart-image-url="${props?.media?.source_url ?? '#'}"`
				)
				.replaceAll(
					'data-picsart-post-id="null"',
					`data-picsart-post-id="${props.currentPostId}"`
				);
		};

		return (
			<Fragment>
				<OriginalComponent {...props} />
				<div className={'picsart-feature-image'} data-picsart-form>
					{picsart_gutenberg_data?.edit_button && (
						<span
							dangerouslySetInnerHTML={{
								__html: replaceAttributes(
									picsart_gutenberg_data.edit_button
								),
							}}
						></span>
					)}
					{hasImage && picsart_gutenberg_data?.remove_bg_button && (
						<span
							dangerouslySetInnerHTML={{
								__html: replaceAttributes(
									picsart_gutenberg_data.remove_bg_button
								),
							}}
						></span>
					)}
					{hasImage && picsart_gutenberg_data?.upscale_dropdown && (
						<span
							dangerouslySetInnerHTML={{
								__html: replaceAttributes(
									picsart_gutenberg_data.upscale_dropdown
								),
							}}
						></span>
					)}
				</div>
			</Fragment>
		);
	};
}

addFilter(
	'editor.PostFeaturedImage',
	'picsart/feature-image-button',
	enhanceFeaturedImage
);
