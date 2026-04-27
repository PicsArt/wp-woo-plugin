(function ($) {
	'use strict';

	$(function () {
		if (typeof window.picsartAdminNotices === 'undefined') {
			return;
		}

		$(document).on('click', '.picsart-notice-dismiss', function (e) {
			e.preventDefault();

			var $notice = $(this).closest('.notice');
			var noticeId = $(this).data('notice-id');

			$.post(window.picsartAdminNotices.ajaxurl, {
				action: 'picsart_dismiss_notice',
				notice_id: noticeId,
				nonce: window.picsartAdminNotices.nonce
			}, function (response) {
				if (response && response.success) {
					$notice.fadeOut(300, function () {
						$(this).remove();
					});
				}
			});
		});
	});
})(jQuery);
