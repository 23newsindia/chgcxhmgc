<?php
/*
Plugin Name: Advanced WooCommerce Sliders
Description: Create multiple full-width sliders for different categories
Version: 1.0
Author: Your Name
*/

if (!defined('ABSPATH')) {
    exit;
}

// Include necessary files
require_once plugin_dir_path(__FILE__) . 'includes/admin/slider-admin.php';
require_once plugin_dir_path(__FILE__) . 'includes/frontend/slider-frontend.php';
require_once plugin_dir_path(__FILE__) . 'includes/slider-cache.php'; // Add this line

// Register activation hook to create database table
register_activation_hook(__FILE__, 'aws_create_sliders_table');

function aws_create_sliders_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'aws_sliders';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        slug varchar(255) NOT NULL,
        settings longtext NOT NULL,
        slides longtext NOT NULL,
        created_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        updated_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY slug (slug)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    // Add default settings option
    add_option('aws_default_settings', json_encode(array(
        'autoplay' => true,
        'autoplay_speed' => 5000,
        'animation_type' => 'slide',
        'animation_speed' => 500,
        'pause_on_hover' => true,
        'infinite_loop' => true,
        'adaptive_height' => false,
        'show_arrows' => true,
        'show_dots' => true,
        'aria_labels' => array(
            'next' => 'Next slide',
            'prev' => 'Previous slide',
            'first' => 'First slide',
            'last' => 'Last slide',
            'slide' => 'Slide %d of %d',
            'play' => 'Play slideshow',
            'pause' => 'Pause slideshow'
        )
    )));
}

// Initialize the plugin
function aws_init() {
    if (is_admin()) {
        new AWS_Admin();
    }
    new AWS_Frontend();
    
    // Initialize cache hooks and preload sliders
    AWS_Slider_Cache::register_cache_clear_hooks();
    AWS_Slider_Cache::preload_sliders(); // Optional but recommended for performance
}
add_action('plugins_loaded', 'aws_init');