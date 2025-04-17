<?php
class AWS_Slider_Cache {
    private static $cache_group = 'aws_sliders';
    private static $cache_time = WEEK_IN_SECONDS;
    
    public static function get_slider($slug) {
        $cache_key = 'slider_' . $slug;
        $slider = wp_cache_get($cache_key, self::$cache_group);
        
        if (false === $slider) {
            global $wpdb;
            $table_name = $wpdb->prefix . 'aws_sliders';
            $slider = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table_name WHERE slug = %s", $slug
            ));
            
            if ($slider) {
                wp_cache_set($cache_key, $slider, self::$cache_group, self::$cache_time);
            }
        }
        
        return $slider;
    }
    
    public static function clear_cache($slug) {
        $cache_key = 'slider_' . $slug;
        wp_cache_delete($cache_key, self::$cache_group);
    }
    
    public static function preload_sliders() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'aws_sliders';
        $sliders = $wpdb->get_results("SELECT slug FROM $table_name");
        
        foreach ($sliders as $slider) {
            self::get_slider($slider->slug);
        }
    }
    
    public static function register_cache_clear_hooks() {
        add_action('save_post', function($post_id) {
            if (has_shortcode(get_post($post_id)->post_content, 'aws_slider')) {
                preg_match_all('/\[aws_slider slug="([^"]+)"\]/', get_post($post_id)->post_content, $matches);
                if (!empty($matches[1])) {
                    foreach ($matches[1] as $slug) {
                        self::clear_cache($slug);
                    }
                }
            }
        });
        
        add_action('aws_slider_updated', function($slider_id) {
            global $wpdb;
            $table_name = $wpdb->prefix . 'aws_sliders';
            $slider = $wpdb->get_row($wpdb->prepare(
                "SELECT slug FROM $table_name WHERE id = %d", $slider_id
            ));
            if ($slider) {
                self::clear_cache($slider->slug);
            }
        });
    }
}