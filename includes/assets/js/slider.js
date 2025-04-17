class AWSSlider {
    constructor(sliderEl) {
        if (!sliderEl) {
            console.error('Slider element not found');
            return;
        }

        // DOM elements
        this.slider = sliderEl;
        this.inner = sliderEl.querySelector('.aws-slider-inner');
        this.slides = Array.from(sliderEl.querySelectorAll('.aws-slide'));
        this.dots = Array.from(sliderEl.querySelectorAll('.aws-dot'));
        
        // State
        this.currentIndex = 0;
        this.slideCount = this.slides.length;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchMoveX = 0;
        this.isDragging = false;
        this.autoplaySpeed = 5000;
        this.isPaused = false;
        this.resizeTimeout = null;

        // Bind methods (better performance than arrow functions)
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Initialize
        if (this.slideCount > 0) {
            this.slider.dataset.state = 'initializing';
            this.initSlider();
        } else {
            console.warn('No slides found for slider');
        }
    }

    initSlider() {
        this.setupSliderDimensions();
        this.setupEventListeners();
        this.startAutoPlay();
        this.updateAriaAttributes();
      this.slider.dataset.state = 'ready'; // Add this when ready
        this.dispatchEvent('initialized');
    }

    setupSliderDimensions() {
        this.slides.forEach(slide => {
            slide.style.minWidth = '100%';
        });
    }

    setupEventListeners() {
        // Touch events
        this.inner.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        this.inner.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.inner.addEventListener('touchend', this.handleTouchEnd, { passive: true });

        // Mouse events for desktop touch simulation
        this.inner.addEventListener('mousedown', this.handleTouchStart);
        this.inner.addEventListener('mousemove', this.handleMouseMove);
        this.inner.addEventListener('mouseup', this.handleTouchEnd);
        this.inner.addEventListener('mouseleave', this.handleTouchEnd);

        // Window events
        window.addEventListener('resize', this.handleResize);
    }

    handleTouchStart(e) {
        if (this.isAnimating) return;
        
        this.isDragging = true;
        this.pauseAutoPlay();
        
        const touch = e.type.includes('touch') ? e.touches[0] : e;
        this.touchStartX = touch.clientX;
        this.touchMoveX = touch.clientX;
        
        this.inner.style.transition = 'none';
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.handleTouchMove(e);
    }

    handleTouchMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        const touch = e.type.includes('touch') ? e.touches[0] : e;
        this.touchMoveX = touch.clientX;
        
        const diff = this.touchStartX - this.touchMoveX;
        const translateX = -this.currentIndex * 100 - (diff / this.slider.offsetWidth) * 100;
        
        this.inner.style.transform = `translateX(${translateX}%)`;
        
        // Prevent vertical scroll when swiping horizontally
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        const touch = e.type.includes('touch') ? e.changedTouches[0] : e;
        this.touchEndX = touch.clientX;
        
        this.handleSwipe();
        this.resumeAutoPlay();
    }

    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        const swipeThreshold = this.slider.offsetWidth * 0.1; // 10% of slider width
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        } else {
            this.goToSlide(this.currentIndex);
        }
    }

   
    goToSlide(index, animate = true) {
        // Boundary checks
        if (this.isAnimating || index < 0 || index >= this.slideCount || index === this.currentIndex) {
            return;
        }

        // Update state
        const direction = index > this.currentIndex ? 'next' : 'prev';
        this.currentIndex = index;
        this.isAnimating = animate;

        // Calculate position
        const translateX = -index * 100;
        
        // Apply transition
        this.inner.style.transition = animate ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        this.inner.style.transform = `translateX(${translateX}%)`;

        // Update UI states
        this.updateDots();
        this.updateAriaAttributes();

        // Handle transition end
        if (animate) {
            const handleTransitionEnd = () => {
                this.inner.removeEventListener('transitionend', handleTransitionEnd);
                this.isAnimating = false;
                this.dispatchEvent('slide-changed', { 
                    index: this.currentIndex,
                    direction 
                });
            };
            this.inner.addEventListener('transitionend', handleTransitionEnd);
        }

        this.dispatchEvent('slide-changing', { index, direction });
    }

    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slideCount;
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slideCount) % this.slideCount;
        this.goToSlide(prevIndex);
    }

    // Autoplay control
    startAutoPlay() {
        if (this.autoPlayInterval) return;
        
        this.autoPlayInterval = setInterval(() => {
            if (!this.isPaused && !this.isDragging) {
                this.nextSlide();
            }
        }, this.autoplaySpeed);
        
        this.dispatchEvent('autoplay-started');
    }

    pauseAutoPlay() {
        if (!this.autoPlayInterval) return;
        this.isPaused = true;
        this.dispatchEvent('autoplay-paused');
    }

    resumeAutoPlay() {
        this.isPaused = false;
        this.dispatchEvent('autoplay-resumed');
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
            this.dispatchEvent('autoplay-stopped');
        }
    }

    // Navigation controls
    updateDots() {
        this.dots.forEach((dot, i) => {
            const isActive = i === this.currentIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive);
            dot.setAttribute('tabindex', isActive ? '0' : '-1');
        });
    }

    handleDotClick(index) {
        this.goToSlide(index);
    }

    // Accessibility
    updateAriaAttributes() {
        this.slides.forEach((slide, i) => {
            const isActive = i === this.currentIndex;
            slide.setAttribute('aria-hidden', !isActive);
            slide.setAttribute('tabindex', isActive ? '0' : '-1');
            
            if (isActive && document.activeElement && !slide.contains(document.activeElement)) {
                slide.focus({ preventScroll: true });
            }
        });
    }

    // Keyboard navigation
    setupKeyboardNavigation() {
        this.slider.addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            
            e.preventDefault();
            switch(e.key) {
                case 'ArrowLeft': this.prevSlide(); break;
                case 'ArrowRight': this.nextSlide(); break;
                case 'Home': this.goToSlide(0); break;
                case 'End': this.goToSlide(this.slideCount - 1); break;
            }
        });
    }

   // Responsive breakpoints
    handleResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateSliderDimensions();
            this.goToSlide(this.currentIndex, false);
            this.dispatchEvent('resized');
        }, 100);
    }

    updateSliderDimensions() {
        const sliderWidth = this.slider.offsetWidth;
        this.slides.forEach(slide => {
            slide.style.width = `${sliderWidth}px`;
            slide.style.flexShrink = '0';
        });
        this.inner.style.width = `${sliderWidth * this.slideCount}px`;
    }

    // Dynamic content handling
    setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') return;

        this.observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                this.reinitializeSlider();
            }
        });

        this.observer.observe(this.slider, {
            childList: true,
            subtree: true
        });
    }

    reinitializeSlider() {
        // Cache current state
        const currentIndex = this.currentIndex;
        
        // Requery DOM elements
        this.inner = this.slider.querySelector('.aws-slider-inner');
        this.slides = Array.from(this.slider.querySelectorAll('.aws-slide'));
        this.dots = Array.from(this.slider.querySelectorAll('.aws-dot'));
        this.slideCount = this.slides.length;

        // Restore state
        this.currentIndex = Math.min(currentIndex, this.slideCount - 1);
        this.updateSliderDimensions();
        this.goToSlide(this.currentIndex, false);
        this.updateDots();
        this.updateAriaAttributes();
        
        this.dispatchEvent('reinitialized');
    }

    // Public methods
    updateSettings(newSettings) {
        this.autoplaySpeed = newSettings.autoplaySpeed || this.autoplaySpeed;
        if (newSettings.autoplay === false) {
            this.stopAutoPlay();
        } else if (!this.autoPlayInterval) {
            this.startAutoPlay();
        }
        this.dispatchEvent('settings-updated');
    }

    // Cleanup
    destroy() {
        // Stop timers
        this.stopAutoPlay();
        clearTimeout(this.resizeTimeout);

        // Remove event listeners
        this.inner.removeEventListener('touchstart', this.handleTouchStart);
        this.inner.removeEventListener('touchmove', this.handleTouchMove);
        this.inner.removeEventListener('touchend', this.handleTouchEnd);
        this.inner.removeEventListener('mousedown', this.handleTouchStart);
        this.inner.removeEventListener('mousemove', this.handleMouseMove);
        this.inner.removeEventListener('mouseup', this.handleTouchEnd);
        this.inner.removeEventListener('mouseleave', this.handleTouchEnd);
        window.removeEventListener('resize', this.handleResize);
        this.slider.removeEventListener('keydown', this.handleKeyDown);

        // Clean up dots
        this.dots.forEach(dot => {
            dot.removeEventListener('click', this.handleDotClick);
        });

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Remove custom events
        const eventNames = [
            'slide-changing',
            'slide-changed',
            'autoplay-started',
            'autoplay-paused',
            'autoplay-resumed',
            'autoplay-stopped',
            'resized',
            'reinitialized',
            'settings-updated'
        ];
        
        eventNames.forEach(event => {
            this.slider.removeEventListener(`aws:${event}`, () => {});
        });

        // Clean up DOM references
        Object.keys(this).forEach(key => {
            delete this[key];
        });

        this.dispatchEvent('destroyed');
    }

    // Static initialization with MutationObserver
    static initAll(selector = '.aws-slider', options = {}) {
        const sliders = Array.from(document.querySelectorAll(selector));
        const instances = sliders.map(el => new AWSSlider(el, options));

        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.matches(selector)) {
                            new AWSSlider(node, options);
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        return instances;
    }
}

// Enhanced initialization with options
document.addEventListener('DOMContentLoaded', () => {
    AWSSlider.initAll('.aws-slider', {
        autoplaySpeed: 5000,        // Default autoplay speed
        pauseOnHover: true,          // Pause when mouse hovers
        infiniteLoop: true,          // Infinite scrolling
        adaptiveHeight: false        // Fixed slider height
        // Add more options as needed
    });
});