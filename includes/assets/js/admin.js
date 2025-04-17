document.addEventListener('DOMContentLoaded', function() {
    /// Elements
    const addNewBtn = document.getElementById('aws-add-new');
    const slidersTable = document.querySelector('.aws-sliders-table');
    const sliderEditor = document.querySelector('.aws-slider-editor');
    const cancelEditBtn = document.getElementById('aws-cancel-edit');
    const saveSliderBtn = document.getElementById('aws-save-slider');
    const addSlideBtn = document.getElementById('aws-add-slide');
    const slidesContainer = document.getElementById('aws-slides-container');
    
    // Show editor when Add New is clicked
    addNewBtn.addEventListener('click', function() {
        slidersTable.style.display = 'none';
        sliderEditor.style.display = 'block';
        resetEditor();
    });
    
    // Cancel editing
    cancelEditBtn.addEventListener('click', function() {
        slidersTable.style.display = 'block';
        sliderEditor.style.display = 'none';
    });
    
    // Add new slide
    addSlideBtn.addEventListener('click', function() {
        addSlide();
    });
    
    // Save slider
    saveSliderBtn.addEventListener('click', function() {
        saveSlider();
    });
    
    // Edit slider event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('aws-edit-slider')) {
            e.preventDefault();
            const sliderId = e.target.getAttribute('data-id');
            getSlider(sliderId);
        }
        
        if (e.target.classList.contains('aws-delete-slider')) {
            e.preventDefault();
            const sliderId = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this slider?')) {
                deleteSlider(sliderId);
            }
        }
        
        // Remove slide
        if (e.target.classList.contains('aws-remove-slide')) {
            e.preventDefault();
            e.target.closest('.aws-slide').remove();
        }
        
        // Media uploader for images
        if (e.target.classList.contains('aws-upload-image')) {
            e.preventDefault();
            const inputField = e.target.nextElementSibling;
            openMediaUploader(inputField);
        }
    });
    
    // Add a new slide to the editor
    function addSlide(slideData = {}) {
        const slideId = Date.now();
        const slideHtml = `
            <div class="aws-slide" data-id="${slideId}">
                <div class="aws-form-group">
                    <label>Slide Title</label>
                    <input type="text" class="aws-slide-title regular-text" value="${slideData.title || ''}">
                </div>
                
                <div class="aws-form-group">
                    <label>Link URL</label>
                    <input type="text" class="aws-slide-link regular-text" value="${slideData.link || ''}">
                </div>
                
                <div class="aws-form-group">
                    <label>Mobile Image</label>
                    <button class="button aws-upload-image">Upload</button>
                    <input type="text" class="aws-slide-mobile-image regular-text" value="${slideData.mobile_image || ''}">
                    <div class="aws-image-preview" style="${slideData.mobile_image ? '' : 'display:none;'}">
                        <img src="${slideData.mobile_image || ''}" style="max-width:100px; height:auto;">
                    </div>
                </div>
                
                <div class="aws-form-group">
                    <label>Desktop Image</label>
                    <button class="button aws-upload-image">Upload</button>
                    <input type="text" class="aws-slide-desktop-image regular-text" value="${slideData.desktop_image || ''}">
                    <div class="aws-image-preview" style="${slideData.desktop_image ? '' : 'display:none;'}">
                        <img src="${slideData.desktop_image || ''}" style="max-width:100px; height:auto;">
                    </div>
                </div>
                
                <button class="button aws-remove-slide">Remove Slide</button>
                <hr>
            </div>
        `;
        slidesContainer.insertAdjacentHTML('beforeend', slideHtml);
    }
    
    // Open WordPress media uploader
    function openMediaUploader(inputField) {
        const frame = wp.media({
            title: 'Select or Upload Image',
            button: { text: 'Use this image' },
            multiple: false
        });
        
        frame.on('select', function() {
            const attachment = frame.state().get('selection').first().toJSON();
            inputField.value = attachment.url;
            
            // Show preview
            const preview = inputField.nextElementSibling;
            preview.style.display = 'block';
            preview.querySelector('img').src = attachment.url;
        });
        
        frame.open();
    }
    
    // Reset editor to empty state
    function resetEditor() {
        document.getElementById('aws-slider-name').value = '';
        document.getElementById('aws-slider-slug').value = '';
        slidesContainer.innerHTML = '';
    }
    
    // Get slider data via AJAX
    function getSlider(sliderId) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', aws_admin_vars.ajax_url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    loadSliderIntoEditor(response.data);
                    slidersTable.style.display = 'none';
                    sliderEditor.style.display = 'block';
                } else {
                    alert('Error: ' + response.data);
                }
            } else {
                alert('Request failed. Returned status of ' + xhr.status);
            }
        };
        
        xhr.onerror = function() {
            alert('Request failed');
        };
        
        const data = new URLSearchParams();
        data.append('action', 'aws_get_slider');
        data.append('nonce', aws_admin_vars.nonce);
        data.append('id', sliderId);
        
        xhr.send(data);
    }
    
    // Load slider data into editor
    function loadSliderIntoEditor(slider) {
        document.getElementById('aws-slider-name').value = slider.name;
        document.getElementById('aws-slider-slug').value = slider.slug;
        
        slidesContainer.innerHTML = '';
         const slides = slider.slides;
        
        slides.forEach(slide => {
            addSlide(slide);
        });
    }
    
    // Save slider via AJAX
    function saveSlider() {
        const name = document.getElementById('aws-slider-name').value.trim();
        const slug = document.getElementById('aws-slider-slug').value.trim();
        
        if (!name || !slug) {
            alert('Please enter both name and slug');
            return;
        }
        
        // Collect slides data
        const slides = [];
        document.querySelectorAll('.aws-slide').forEach(slideEl => {
            slides.push({
                title: slideEl.querySelector('.aws-slide-title').value,
                link: slideEl.querySelector('.aws-slide-link').value,
                mobile_image: slideEl.querySelector('.aws-slide-mobile-image').value,
                desktop_image: slideEl.querySelector('.aws-slide-desktop-image').value
            });
        });
        
        if (slides.length === 0) {
            alert('Please add at least one slide');
            return;
        }
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', aws_admin_vars.ajax_url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    alert('Slider saved successfully');
                    location.reload(); // Refresh to show updated list
                } else {
                    alert('Error: ' + response.data);
                }
            } else {
                alert('Request failed. Returned status of ' + xhr.status);
            }
        };
        
        xhr.onerror = function() {
            alert('Request failed');
        };
        
        const data = new URLSearchParams();
        data.append('action', 'aws_save_slider');
        data.append('nonce', aws_admin_vars.nonce);
        data.append('name', name);
        data.append('slug', slug);
        data.append('slides', JSON.stringify(slides));
        
        xhr.send(data);
    }
    
    // Delete slider via AJAX
    function deleteSlider(sliderId) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', aws_admin_vars.ajax_url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    alert('Slider deleted successfully');
                    location.reload(); // Refresh to show updated list
                } else {
                    alert('Error: ' + response.data);
                }
            } else {
                alert('Request failed. Returned status of ' + xhr.status);
            }
        };
        
        xhr.onerror = function() {
            alert('Request failed');
        };
        
        const data = new URLSearchParams();
        data.append('action', 'aws_delete_slider');
        data.append('nonce', aws_admin_vars.nonce);
        data.append('id', sliderId);
        
        xhr.send(data);
    }
});
