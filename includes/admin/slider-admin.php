<?php
class AWS_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_aws_save_slider', array($this, 'save_slider'));
        add_action('wp_ajax_aws_delete_slider', array($this, 'delete_slider'));
        add_action('wp_ajax_aws_get_slider', array($this, 'get_slider'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'WooCommerce Sliders',
            'WC Sliders',
            'manage_options',
            'aws-sliders',
            array($this, 'render_admin_page'),
            'dashicons-slides',
            30
        );
    }

    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'toplevel_page_aws-sliders') {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style('aws-admin-css', plugins_url('../assets/css/admin.css', __FILE__));
        wp_enqueue_script('aws-admin-js', plugins_url('../assets/js/admin.js', __FILE__), array('jquery', 'wp-util'), '1.0', true);

        wp_localize_script('aws-admin-js', 'aws_admin_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('aws_admin_nonce')
        ));
    }

    public function render_admin_page() {
        ?>
        public function render_admin_page() {
    ?>
    <div class="wrap aws-admin">
        <h1>WooCommerce Sliders</h1>
        
        <div class="aws-admin-container">
            <div class="aws-sliders-list">
                <div class="aws-header">
                    <h2>Your Sliders</h2>
                    <button id="aws-add-new" class="button button-primary">Add New Slider</button>
                </div>
                
                <div class="aws-sliders-table">
                    <?php $this->render_sliders_table(); ?>
                </div>
            </div>
            
            <div class="aws-slider-editor" style="display: none;">
                <div class="aws-editor-header">
                    <h2>Edit Slider</h2>
                    <div class="aws-editor-actions">
                        <button id="aws-save-slider" class="button button-primary">Save Slider</button>
                        <button id="aws-cancel-edit" class="button">Cancel</button>
                    </div>
                </div>
                
                <div class="aws-editor-form">
                    <div class="aws-form-group">
                        <label for="aws-slider-name">Slider Name</label>
                        <input type="text" id="aws-slider-name" class="regular-text" required>
                    </div>
                    
                    <div class="aws-form-group">
                        <label for="aws-slider-slug">Slider Slug (shortcode)</label>
                        <input type="text" id="aws-slider-slug" class="regular-text" required>
                        <p class="description">This will be used in the shortcode like [aws_slider slug="your-slug"]</p>
                    </div>
                    
                    <h3>Slides</h3>
                    <div id="aws-slides-container">
                        <!-- Slides will be added here -->
                    </div>
                    
                    <button id="aws-add-slide" class="button">Add Slide</button>
                    
                    <!-- Add the settings section here -->
                    <h3>Slider Settings</h3>
                    <div class="aws-settings-grid">
                        <div class="aws-form-group">
                            <label>
                                <input type="checkbox" id="aws-autoplay" checked>
                                Autoplay
                            </label>
                        </div>
                        
                        <div class="aws-form-group">
                            <label for="aws-autoplay-speed">Autoplay Speed (ms)</label>
                            <input type="number" id="aws-autoplay-speed" value="5000" min="1000" step="500">
                        </div>
                        
                        <div class="aws-form-group">
                            <label for="aws-animation-type">Animation Type</label>
                            <select id="aws-animation-type">
                                <option value="slide">Slide</option>
                                <option value="fade">Fade</option>
                            </select>
                        </div>
                        
                        <div class="aws-form-group">
                            <label for="aws-animation-speed">Animation Speed (ms)</label>
                            <input type="number" id="aws-animation-speed" value="500" min="100" step="50">
                        </div>
                        
                        <div class="aws-form-group">
                            <label>
                                <input type="checkbox" id="aws-pause-on-hover" checked>
                                Pause on Hover
                            </label>
                        </div>
                        
                        <div class="aws-form-group">
                            <label>
                                <input type="checkbox" id="aws-infinite-loop" checked>
                                Infinite Loop
                            </label>
                        </div>
                        
                        <div class="aws-form-group">
                            <label>
                                <input type="checkbox" id="aws-show-arrows" checked>
                                Show Navigation Arrows
                            </label>
                        </div>
                        
                        <div class="aws-form-group">
                            <label>
                                <input type="checkbox" id="aws-show-dots" checked>
                                Show Pagination Dots
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
}

    private function render_sliders_table() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'aws_sliders';
        $sliders = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC");
        
        if (empty($sliders)) {
            echo '<p>No sliders found. Create your first slider!</p>';
            return;
        }
        
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr>
                <th>Name</th>
                <th>Shortcode</th>
                <th>Slides</th>
                <th>Created</th>
                <th>Actions</th>
            </tr></thead>';
        echo '<tbody>';
        
        foreach ($sliders as $slider) {
            $slides = maybe_unserialize($slider->slides);
            $slide_count = is_array($slides) ? count($slides) : 0;
            
            echo '<tr>
                <td>' . esc_html($slider->name) . '</td>
                <td><code>[aws_slider slug="' . esc_attr($slider->slug) . '"]</code></td>
                <td>' . $slide_count . ' slides</td>
                <td>' . date('M j, Y', strtotime($slider->created_at)) . '</td>
                <td>
                    <button class="button aws-edit-slider" data-id="' . $slider->id . '">Edit</button>
                    <button class="button aws-delete-slider" data-id="' . $slider->id . '">Delete</button>
                </td>
            </tr>';
        }
        
        echo '</tbody></table>';
    }

   public function save_slider() {
    check_ajax_referer('aws_admin_nonce', 'nonce');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'aws_sliders';
    
    $name = sanitize_text_field($_POST['name']);
    $slug = sanitize_text_field($_POST['slug']);
    $slides = stripslashes($_POST['slides']); // We'll sanitize this later
    
    // Basic validation
    if (empty($name) || empty($slug) || empty($slides)) {
        wp_send_json_error('All fields are required');
        return;
    }
    
    // Validate slides JSON
    $slides_data = json_decode($slides, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($slides_data)) {
        wp_send_json_error('Invalid slides data');
        return;
    }
    
    // Sanitize slides data
    $sanitized_slides = array();
    foreach ($slides_data as $slide) {
        $sanitized_slides[] = array(
            'title' => sanitize_text_field($slide['title']),
            'link' => esc_url_raw($slide['link']),
            'mobile_image' => esc_url_raw($slide['mobile_image']),
            'desktop_image' => esc_url_raw($slide['desktop_image'])
        );
    }
    
    $data = array(
        'name' => $name,
        'slug' => $slug,
        'slides' => maybe_serialize($sanitized_slides),
        'updated_at' => current_time('mysql')
    );
    
    // Check if we're updating an existing slider
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT id FROM $table_name WHERE slug = %s", $slug
    ));
    
    if ($existing) {
        $wpdb->update($table_name, $data, array('id' => $existing->id));
    } else {
        $data['created_at'] = current_time('mysql');
        $wpdb->insert($table_name, $data);
    }
    
    wp_send_json_success('Slider saved successfully');
}

public function delete_slider() {
    check_ajax_referer('aws_admin_nonce', 'nonce');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'aws_sliders';
    
    $id = intval($_POST['id']);
    
    $result = $wpdb->delete($table_name, array('id' => $id));
    
    if ($result === false) {
        wp_send_json_error('Failed to delete slider');
    } else {
        wp_send_json_success('Slider deleted successfully');
    }
}

public function get_slider() {
    check_ajax_referer('aws_admin_nonce', 'nonce');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'aws_sliders';
    
    $id = intval($_POST['id']);
    
    $slider = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE id = %d", $id
    ));
    
    if (!$slider) {
        wp_send_json_error('Slider not found');
        return;
    }
    
    wp_send_json_success(array(
        'id' => $slider->id,
        'name' => $slider->name,
        'slug' => $slider->slug,
        'slides' => maybe_unserialize($slider->slides),
        'created_at' => $slider->created_at,
        'updated_at' => $slider->updated_at
    ));
}

  
}