<?php
/**
 * Modal
 *
 * @package Picsart
 */

namespace PICSART\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Modal {

	/**
	 * @return void
	 */
	public function run() {
		add_action( 'admin_footer', array( $this, 'add_modal_root_element' ) );
	}

	/**
	 * Add a root element for the React modal to mount to.
	 */
	public function add_modal_root_element(): void {
		echo '<div id="picsart-modal-root"></div>';
	}
}
