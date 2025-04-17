<?php
class AWS_Documentation {
    public static function add_docs_page() {
        add_submenu_page(
            'aws-sliders',
            'Slider Documentation',
            'Documentation',
            'manage_options',
            'aws-slider-docs',
            array(__CLASS__, 'render_docs_page')
        );
    }
    
    public static function render_docs_page() {
        ?>
        <div class="wrap aws-docs">
            <h1>WooCommerce Slider Documentation</h1>
            
            <h2>Creating a Slider</h2>
            <ol>
                <li>Go to "WC Sliders" in the WordPress admin menu</li>
                <li>Click "Add New Slider"</li>
                <li>Enter a name and slug for your slider</li>
                <li>Add slides with mobile and desktop images</li>
                <li>Configure slider settings</li>
                <li>Click "Save Slider"</li>
            </ol>
            
            <h2>Using the Shortcode</h2>
            <p>To display a slider, use the following shortcode:</p>
            <pre><code>[aws_slider slug="your-slug-here"]</code></pre>
            
            <h2>Shortcode Parameters</h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                        <th>Default</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>slug</td>
                        <td>The unique slug of the slider (required)</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td>autoplay</td>
                        <td>Enable/disable autoplay (true/false)</td>
                        <td>From slider settings</td>
                    </tr>
                    <tr>
                        <td>autoplay_speed</td>
                        <td>Autoplay speed in milliseconds</td>
                        <td>From slider settings</td>
                    </tr>
                    <tr>
                        <td>animation_type</td>
                        <td>Animation type (slide/fade)</td>
                        <td>From slider settings</td>
                    </tr>
                </tbody>
            </table>
            
            <h2>Customizing with CSS</h2>
            <p>You can customize the slider appearance by targeting these CSS classes:</p>
            <ul>
                <li><code>.aws-slider</code> - The main slider container</li>
                <li><code>.aws-slide</code> - Individual slide</li>
                <li><code>.aws-arrow</code> - Navigation arrows</li>
                <li><code>.aws-dot</code> - Pagination dots</li>
            </ul>
            
            <h2>Accessibility Features</h2>
            <ul>
                <li>Keyboard navigation (arrow keys, Home, End)</li>
                <li>ARIA attributes for screen readers</li>
                <li>Focus styles for keyboard users</li>
                <li>Respects reduced motion preferences</li>
            </ul>
        </div>
        <?php
    }
}