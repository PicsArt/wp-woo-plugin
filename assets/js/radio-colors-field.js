(function ($) {
	'use strict';

	function initField($container) {
		var fieldSelector = $container.data('target');
		var pickerSelector = $container.data('picker-target');

		if (!fieldSelector || !pickerSelector) {
			return;
		}

		var $field = $(fieldSelector);
		var $picker = $(pickerSelector);
		var $pickerWrapper = $(pickerSelector + '_wrapper');

		if (!$field.length || !$picker.length) {
			return;
		}

		if (typeof $picker.wpColorPicker === 'function') {
			$picker.wpColorPicker({
				change: function (event, ui) {
					$field.val(ui.color.toString()).trigger('change');
				},
				clear: function () {
					$field.val('').trigger('change');
				}
			});
		}

		$container.find('.picsart-color-option').on('click', function () {
			var selectedColor = $(this).data('color');

			$container.find('.picsart-color-option').css('border', '2px solid #ccc');
			$(this).css('border', '2px solid #333');

			$field.val(selectedColor).trigger('change');

			if (selectedColor === 'multicolor') {
				$pickerWrapper.slideDown();
				if (typeof $picker.wpColorPicker === 'function') {
					$picker.wpColorPicker('color', $field.val());
				}
			} else {
				$pickerWrapper.slideUp();
			}
		});
	}

	$(function () {
		$('.picsart-radio-color-field').each(function () {
			initField($(this));
		});
	});
})(jQuery);
