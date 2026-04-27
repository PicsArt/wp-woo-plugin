(function ($) {
	'use strict';

	function initField($wrapper) {
		var fieldSelector = $wrapper.data('field-target');
		var previewSelector = $wrapper.data('preview-target');
		var selectSelector = $wrapper.data('select-target');
		var removeSelector = $wrapper.data('remove-target');

		if (!fieldSelector || !previewSelector || !selectSelector || !removeSelector) {
			return;
		}

		var $field = $(fieldSelector);
		var $preview = $(previewSelector);
		var $selectBtn = $(selectSelector);
		var $removeBtn = $(removeSelector);

		if (!$field.length || !$selectBtn.length) {
			return;
		}

		var frame;

		$selectBtn.on('click', function (e) {
			e.preventDefault();

			if (frame) {
				frame.open();
				return;
			}

			frame = wp.media({ multiple: false });

			frame.on('select', function () {
				var attachment = frame.state().get('selection').first().toJSON();
				$field.val(attachment.url);
				$preview.attr('src', attachment.url).show();
				$removeBtn.show();
			});

			frame.open();
		});

		$removeBtn.on('click', function () {
			$field.val('');
			$preview.hide();
			$removeBtn.hide();
		});
	}

	$(function () {
		$('.picsart-media-library-field').each(function () {
			initField($(this));
		});
	});
})(jQuery);
