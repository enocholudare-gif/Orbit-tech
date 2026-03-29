document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileClose = document.getElementById('mobileClose');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-links a');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        });
    }

    if (mobileClose && mobileMenu) {
        mobileClose.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = ''; 
        });
    }

    // Close menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // 2. Sticky Navbar
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Scroll to Top Button
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 4. Scroll Reveal Animations (Intersection Observer)
    const animateElements = document.querySelectorAll('[data-animate]');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Determine animation delay if provided
                const delay = entry.target.getAttribute('data-delay') || 0;
                
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, delay);
                
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // 5. Active Nav Link Highlighting (Intersection Observer)
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-links a');

    const navObserverOptions = {
        threshold: 0.3
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${currentId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, navObserverOptions);

    sections.forEach(section => {
        if (section.getAttribute('id')) {
            navObserver.observe(section);
        }
    });

    // 6. Form Submission
    const quoteForm = document.getElementById('quoteForm');
    const formStatus = document.getElementById('formStatus');

    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = quoteForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                service: document.getElementById('service').value,
                message: document.getElementById('message').value
            };

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (res.ok) {
                    formStatus.style.color = '#25D366'; // Success Green
                    formStatus.textContent = 'Thank you! Your request has been received. Our team will contact you shortly.';
                    quoteForm.reset();
                } else {
                    const errorData = await res.json();
                    formStatus.style.color = '#ff4d4d'; // Error Red
                    formStatus.textContent = errorData.error || 'Failed to send message. Please try again.';
                }
            } catch (error) {
                console.error('Contact form error:', error);
                formStatus.style.color = '#ff4d4d';
                formStatus.textContent = 'Server error. Please try again later.';
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Remove message after 5 seconds
                setTimeout(() => {
                    formStatus.textContent = '';
                }, 5000);
            }
        });
    }

    // 7. FAQ Accordion Toggle
    const faqToggles = document.querySelectorAll('.faq-toggle');
    
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            
            // Close all other accordions (Optional, but clean)
            faqToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.setAttribute('aria-expanded', 'false');
                    otherToggle.nextElementSibling.style.maxHeight = null;
                }
            });

            // Toggle current accordion
            if (isExpanded) {
                toggle.setAttribute('aria-expanded', 'false');
                content.style.maxHeight = null;
            } else {
                toggle.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // 8. Fetch Dynamic Blog Posts
    const blogGrid = document.getElementById('blog-grid');
    if (blogGrid) {
        async function loadBlogPosts() {
            try {
                const res = await fetch('/api/posts', { cache: 'no-store' });
                console.log('Blog posts API response status:', res.status);
                
                if (!res.ok) throw new Error('API down');
                
                const posts = await res.json();
                console.log('Fetched blog posts:', posts);
                
                if (posts.length === 0) {
                    blogGrid.innerHTML = '<p class="text-center text-muted w-100">Check back later for new insights!</p>';
                    return;
                }

                window.loadedPosts = posts; // Save globally for the modal
                
                blogGrid.innerHTML = posts.map((post, index) => {
                    const delay = index * 100;
                    const shortSnippet = post.snippet.length > 120 ? post.snippet.substring(0, 120) + '...' : post.snippet;
                    return `
                        <article class="blog-card glass-card hover-lift" data-animate="fade-up" style="animation-delay: ${delay}ms;">
                            <div class="blog-img">
                                <img src="${post.image}" alt="${post.title}"
                                    onerror="this.src='https://placehold.co/400x250/1a1a1a/FFD700?text=Tech';">
                            </div>
                            <div class="blog-content">
                                <span class="blog-tag">${post.tag}</span>
                                <h3><a href="javascript:void(0)" onclick="openBlogModal(${index})">${post.title}</a></h3>
                                <p>${shortSnippet}</p>
                                <a href="javascript:void(0)" class="read-more" onclick="openBlogModal(${index})">Read More <i class="fas fa-arrow-right"></i></a>
                            </div>
                        </article>
                    `;
                }).join('');
                
                // Observe the newly added elements for scroll animations
                const newBlogCards = blogGrid.querySelectorAll('[data-animate]');
                newBlogCards.forEach(el => {
                    if (window.scrollObserver) {
                        window.scrollObserver.observe(el);
                    } else if (scrollObserver) {
                        scrollObserver.observe(el);
                    }
                });
                
            } catch (err) {
                console.error("Error fetching blog posts:", err);
                blogGrid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">Welcome to Orbit Tech Insights. Our blog is connecting to the main server.</p>';
            }
        }
        
        loadBlogPosts();
    }
});

// 9. Blog Modal Global Function
window.openBlogModal = function(index) {
    if(!window.loadedPosts) return;
    const post = window.loadedPosts[index];
    if(!post) return;
    
    document.getElementById('modalTitle').textContent = post.title;
    document.getElementById('modalTag').textContent = post.tag;
    document.getElementById('modalDate').textContent = new Date(post.timestamp).toLocaleDateString();
    
    const imgElement = document.getElementById('modalImg');
    imgElement.src = post.image;
    imgElement.onerror = function() {
        this.src='https://placehold.co/800x400/1a1a1a/FFD700?text=Tech';
    };
    
    document.getElementById('modalSnippet').textContent = post.snippet;
    
    const modal = document.getElementById('blogModal');
    modal.style.display = 'flex';
    // Small timeout to allow display property to apply before adding class
    setTimeout(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 10);
};

// Setup Modal Close listeners
document.addEventListener('DOMContentLoaded', () => {
    const blogModal = document.getElementById('blogModal');
    const blogModalClose = document.getElementById('blogModalClose');

    if (blogModalClose) {
        blogModalClose.addEventListener('click', () => {
            blogModal.classList.remove('active');
            setTimeout(() => {
                blogModal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        });
    }

    if (blogModal) {
        blogModal.addEventListener('click', (e) => {
            if (e.target === blogModal) {
                blogModalClose.click();
            }
        });
    }
});
