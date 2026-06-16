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
                    const previewText = post.snippet || '';
                    const plainPreview = previewText.replace(/[#>*_]/g, '').trim();
                    const shortSnippet = plainPreview.length > 140 ? plainPreview.substring(0, 140) + '...' : plainPreview;
                    return `
                        <article class="blog-card glass-card hover-lift" data-animate="fade-up" style="animation-delay: ${delay}ms;">
                            <div class="blog-img">
                                <img src="${post.image}" alt="${post.title}"
                                    onerror="this.src='https://placehold.co/400x250/1a1a1a/FFD700?text=Tech';">
                            </div>
                            <div class="blog-content">
                                <span class="blog-tag">${post.tag}</span>
                                <h3><a href="insight.html?id=${post.id}">${post.title}</a></h3>
                                <p>${shortSnippet}</p>
                                <a href="insight.html?id=${post.id}" class="read-more">Learn More <i class="fas fa-arrow-right"></i></a>
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

    // 8.5 Fetch Dynamic Portfolio
    const homePortfolioGrid = document.getElementById('homePortfolioGrid');
    if (homePortfolioGrid) {
        async function loadHomePortfolio() {
            try {
                const res = await fetch('/api/projects');
                const projects = await res.json();

                if (!projects.length) {
                    homePortfolioGrid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">Projects will appear here as they are published by the admin.</p>';
                    return;
                }

                const featuredProjects = projects.filter(project => project.featured).slice(0, 4);
                const visibleProjects = featuredProjects.length ? featuredProjects : projects.slice(0, 6);

                homePortfolioGrid.innerHTML = visibleProjects.map(project => {
                    const image = project.imageUrl || project.image || 'https://placehold.co/800x500/111111/FFD700?text=Orbit+Tech+Project';
                    const link = project.link || project.projectLink || project.url || '';

                    return '<article class="portfolio-card glass-card hover-lift" data-animate="fade-up">' +
                        '<span class="project-category-tag">' + project.category + '</span>' +
                        (project.featured ? '<span class="project-featured-tag">Featured</span>' : '') +
                        '<img src="' + image + '" alt="' + project.title + '" class="portfolio-card-img">' +
                        '<div class="portfolio-card-body">' +
                            '<h3>' + project.title + '</h3>' +
                            '<p class="text-muted">' + (project.description || 'A recent project delivered by Orbit Tech.') + '</p>' +
                            '<div class="portfolio-card-actions">' +
                                (link ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Visit Project <i class="fas fa-external-link-alt"></i></a>' : '') +
                                '<a href="portfolio.html" class="btn btn-outline">More Details</a>' +
                            '</div>' +
                        '</div>' +
                    '</article>';
                }).join('');

                const newProjectCards = homePortfolioGrid.querySelectorAll('[data-animate]');
                newProjectCards.forEach(el => observer.observe(el));
            } catch (error) {
                console.error('Error fetching projects:', error);
                homePortfolioGrid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">Projects will appear here as they are published by the admin.</p>';
            }
        }
                loadHomePortfolio();
    }

    // 8.6 Fetch Dynamic Testimonials
    const testimonialGrid = document.querySelector('.testimonial-grid');
    if (testimonialGrid) {
        async function loadTestimonials() {
            try {
                const res = await fetch('/api/testimonials');
                if (!res.ok) throw new Error('API down');
                const testimonials = await res.json();
                
                if (testimonials.length > 0) {
                    const dynamicHtml = testimonials.map((t, index) => {
                        const delay = index * 100;
                        const isVideo = t.type === 'video';
                        
                        return `
                            <div class="testimonial-card dynamic-review glass-card hover-lift" data-animate="fade-up" style="animation-delay: ${delay}ms; display: none;">
                                ${isVideo ? `
                                    <div class="video-container" style="position:relative; border-radius:12px; overflow:hidden; margin-bottom:1.5rem; background:#000;">
                                        <video src="${t.videoUrl}" style="width:100%; aspect-ratio:16/9; display: block;" controls></video>
                                    </div>
                                ` : ''}
                                <p class="review-text">"${t.text}"</p>
                                <div class="client-info">
                                    <div class="client-avatar">
                                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random" alt="${t.name}">
                                    </div>
                                    <div>
                                        <h4>${t.name}</h4>
                                        <p>${t.role}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    testimonialGrid.insertAdjacentHTML('beforeend', dynamicHtml);
                }

                // Add Show More Logic (Moved outside if testimonials check)
                const viewAllBtn = document.getElementById('viewAllReviews');
                if (viewAllBtn) {
                    viewAllBtn.addEventListener('click', () => {
                        const hiddenReviews = document.querySelectorAll('.dynamic-review, .hidden-review');
                        if (hiddenReviews.length > 0) {
                            hiddenReviews.forEach(r => {
                                r.style.display = 'block';
                                r.classList.add('fade-in-visible');
                            });
                            viewAllBtn.style.display = 'none';
                        } else {
                            alert('No more reviews to show at the moment.');
                        }
                    });
                }

            } catch (err) {
                console.error("Error fetching testimonials:", err);
            }
        }
        loadTestimonials();
    }


    // 10. AI Chat Assistant Logic
    const aiChatForm = document.getElementById('aiChatForm');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatMessages = document.getElementById('aiChatMessages');

    if (aiChatForm && aiChatInput && aiChatMessages) {
        aiChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userText = aiChatInput.value.trim();
            if (!userText) return;

            // 1. Add User Message to UI
            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'chat-message user-message';
            userMsgDiv.innerHTML = `<div class="message-content">${userText}</div>`;
            aiChatMessages.appendChild(userMsgDiv);
            
            aiChatInput.value = '';
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight; // Scroll to bottom

            // 2. Add Typing Indicator
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message ai-message typing-container';
            typingDiv.innerHTML = `<div class="message-content typing-indicator"><span></span><span></span><span></span></div>`;
            aiChatMessages.appendChild(typingDiv);
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

            try {
                // 3. Fetch from backend
                const res = await fetch('/api/ask-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: userText })
                });

                const data = await res.json();
                
                // Remove typing indicator
                if (typingDiv.parentNode) aiChatMessages.removeChild(typingDiv);

                // 4. Add AI Response to UI
                const aiMsgDiv = document.createElement('div');
                aiMsgDiv.className = 'chat-message ai-message';
                
                // Convert simple markdown links or bold to HTML if needed
                let formattedReply = data.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                formattedReply = formattedReply.replace(/\n/g, '<br>');

                aiMsgDiv.innerHTML = `<div class="message-content">${formattedReply}</div>`;
                aiChatMessages.appendChild(aiMsgDiv);
                
            } catch (err) {
                console.error("AI Error:", err);
                if (typingDiv.parentNode) aiChatMessages.removeChild(typingDiv);
                
                const errDiv = document.createElement('div');
                errDiv.className = 'chat-message ai-message';
                errDiv.innerHTML = `<div class="message-content" style="color: #ff4d4d;">Sorry, I encountered a server error. Please try again later or browse the FAQ below.</div>`;
                aiChatMessages.appendChild(errDiv);
            }
            
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        });
    }

    // 11. Floating AI Assistant Toggle
    const floatingAIBtn = document.getElementById('floatingAIBtn');
    const floatingAIChat = document.getElementById('floatingAIChat');
    const closeAIChat = document.getElementById('closeAIChat');

    if (floatingAIBtn && floatingAIChat) {
        floatingAIBtn.addEventListener('click', () => {
            floatingAIChat.classList.toggle('active');
            if (floatingAIChat.classList.contains('active')) {
                setTimeout(() => document.getElementById('aiChatInput').focus(), 300);
            }
        });

        if (closeAIChat) {
            closeAIChat.addEventListener('click', () => {
                floatingAIChat.classList.remove('active');
            });
        }
    }
});

// 9. Blog Modal Global Function
window.openBlogModal = function(index) {
    if(!window.loadedPosts) return;
    const post = window.loadedPosts[index];
    if(!post) return;

    const fullPostContent = post.content || post.snippet || '';
    const formattedContent = fullPostContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*)$/gm, '<h4>$1</h4>')
        .replace(/^## (.*)$/gm, '<h3>$1</h3>')
        .replace(/^# (.*)$/gm, '<h2>$1</h2>')
        .replace(/(?:\r?\n){2,}/g, '</p><p>')
        .replace(/\r?\n/g, '<br>');
    
    document.getElementById('modalTitle').textContent = post.title;
    document.getElementById('modalTag').textContent = post.tag;
    document.getElementById('modalDate').textContent = new Date(post.timestamp).toLocaleDateString();
    
    const imgElement = document.getElementById('modalImg');
    imgElement.src = post.image;
    imgElement.onerror = function() {
        this.src='https://placehold.co/800x400/1a1a1a/FFD700?text=Tech';
    };
    
    document.getElementById('modalSnippet').innerHTML = '<p>' + formattedContent + '</p>';
    
    const modal = document.getElementById('blogModal');
    modal.style.display = 'flex';
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

// 10. Project Estimator Calculator
document.addEventListener('DOMContentLoaded', () => {
    const calcService = document.getElementById('calcService');
    const calcPackages = document.querySelectorAll('input[name="calcPackage"]');
    const calcPriceDisplay = document.getElementById('calcPriceDisplay');
    const calcPackageTitle = document.getElementById('calcPackageTitle');
    const calcPackageFeatures = document.getElementById('calcPackageFeatures');
    const btnNGN = document.getElementById('btnNGN');
    const btnUSD = document.getElementById('btnUSD');
    const btnStartProject = document.getElementById('btnStartProject');
    const btnNegotiate = document.getElementById('btnNegotiate');
    
    let pricingData = null;
    let currentCurrency = 'NGN'; // Default to NGN
    const packageDeliverables = {
        'web-dev': {
            basic: ['1-3 page website', 'Responsive layout', 'Contact form setup', 'Basic SEO setup'],
            standard: ['Up to 6 pages', 'Custom UI sections', 'CMS or dynamic content', 'Speed and on-page SEO optimization'],
            premium: ['Advanced custom website or web app', 'User dashboard or integrations', 'Automation-ready backend features', 'Premium support and launch assistance']
        },
        'mobile-app-development': {
            basic: ['Single-platform MVP app', 'Core user flows', 'Basic UI design', 'Testing before launch'],
            standard: ['Cross-platform mobile app', 'API integration', 'Admin or content management support', 'Improved UX and performance tuning'],
            premium: ['Full-featured production app', 'Authentication and user roles', 'Payments, push notifications, or advanced integrations', 'Deployment support and post-launch assistance']
        },
        'ai-automation': {
            basic: ['1 automation workflow', 'Basic lead or task automation', 'Simple third-party tool connection', 'Setup guidance'],
            standard: ['Multiple connected workflows', 'CRM or email automation', 'Error handling and testing', 'Performance review'],
            premium: ['Complex business automation system', 'AI-assisted workflows', 'Multi-platform integrations', 'Optimization and scaling support']
        },
        'graphic-design': {
            basic: ['1 design concept', 'Basic brand-aligned graphics', 'Standard export files', 'Minor revisions'],
            standard: ['Multiple polished design assets', 'Stronger visual direction', 'Source files included', 'More revision rounds'],
            premium: ['Full premium design package', 'Campaign-ready creative set', 'Advanced mockups and presentation assets', 'Priority revisions and source files']
        },
        'digital-marketing': {
            basic: ['Basic campaign planning', 'Audience targeting setup', 'Simple content direction', 'Performance check-in'],
            standard: ['Multi-channel campaign setup', 'Conversion-focused creatives', 'Optimization and reporting', 'Funnel improvement recommendations'],
            premium: ['Full marketing strategy rollout', 'Advanced ads optimization', 'Retargeting and scaling plan', 'Detailed reporting and strategy calls']
        },
        'branding': {
            basic: ['Logo concept', 'Basic color direction', 'Typography guidance', 'Starter brand usage notes'],
            standard: ['Logo suite and visual identity', 'Brand color and font system', 'Social/profile assets', 'Brand guideline document'],
            premium: ['Full brand identity system', 'Brand strategy direction', 'Print and digital brand assets', 'Comprehensive brand guide']
        },
        'erp-softwares': {
            basic: ['Workflow discovery', 'Basic system structure setup', 'Core operational mapping', 'Team onboarding support'],
            standard: ['Department workflow alignment', 'Role-based process setup', 'Reporting structure', 'Implementation support'],
            premium: ['Full ERP implementation support', 'Advanced workflow customization', 'Team training and optimization', 'Post-deployment review']
        },
        'social-media': {
            basic: ['Content plan starter', 'Profile optimization', 'Basic posting support', 'Growth recommendations'],
            standard: ['Monthly content management', 'Branded creatives', 'Engagement support', 'Performance reporting'],
            premium: ['Advanced social media management', 'Campaign strategy and execution', 'Community growth support', 'Deep analytics and scaling plan']
        },
        'page-setup': {
            basic: ['Single platform setup', 'Bio and profile optimization', 'Basic visual branding', 'Contact/action button setup'],
            standard: ['Multi-section page setup', 'Improved design consistency', 'Link and conversion optimization', 'Platform best-practice setup'],
            premium: ['Premium page experience setup', 'Custom branded assets', 'Advanced conversion layout', 'Optimization support after launch']
        },
        'tech-consultation': {
            basic: ['Short strategy session', 'Problem analysis', 'Recommended tools', 'Action summary'],
            standard: ['In-depth consultation', 'Technical roadmap', 'Priority implementation advice', 'Follow-up support'],
            premium: ['Comprehensive advisory support', 'Business and tech scaling recommendations', 'Process audit and solution architecture', 'Extended follow-up guidance']
        }
    };
    
    if (calcService && calcPriceDisplay) {
        const calcOtherServiceGroup = document.getElementById('calcOtherServiceGroup');
        const calcOtherServiceInput = document.getElementById('calcOtherService');
        
        // Fetch pricing from backend
        async function initCalculator() {
            try {
                const res = await fetch('/api/pricing');
                if (res.ok) {
                    pricingData = await res.json();
                    
                    // Populate Select dynamically
                    calcService.innerHTML = '';
                    Object.keys(pricingData.services).forEach(key => {
                        const opt = document.createElement('option');
                        opt.value = key;
                        opt.textContent = pricingData.services[key].name;
                        calcService.appendChild(opt);
                    });
                    
                    // Add Other Option
                    const otherOpt = document.createElement('option');
                    otherOpt.value = 'other';
                    otherOpt.textContent = 'Other (Please Specify)';
                    calcService.appendChild(otherOpt);
                    
                    updatePrice();
                }
            } catch (err) {
                console.error("Pricing fetch failed", err);
                calcService.innerHTML = '<option value="">Failed to load.</option>';
            }
        }
        
        function updatePrice() {
            if (!pricingData) return;
            
            const serviceKey = calcService.value;
            let packageKey = 'standard';
            calcPackages.forEach(p => { if(p.checked) packageKey = p.value; });
            
            let finalString = '';
            
            if (serviceKey === 'other') {
                calcOtherServiceGroup.style.display = 'block';
                finalString = 'Custom Pricing';
            } else {
                calcOtherServiceGroup.style.display = 'none';
                
                // Get base USD price
                const serviceObj = pricingData.services[serviceKey];
                if (!serviceObj) return;
                
                const baseUsd = serviceObj.packages[packageKey];
                
                // Format and display
                if (currentCurrency === 'USD') {
                    finalString = `USD ${baseUsd.toLocaleString()}`;
                } else {
                    const ngnPrice = baseUsd * pricingData.exchangeRate;
                    finalString = `NGN ${ngnPrice.toLocaleString()}`;
                }
            }
            
            // Animate number change
            calcPriceDisplay.style.opacity = '0';
            setTimeout(() => {
                calcPriceDisplay.textContent = finalString;
                calcPriceDisplay.style.opacity = '1';
                
                // Adjust font size if custom pricing text is too long
                if (serviceKey === 'other') calcPriceDisplay.style.fontSize = '2rem';
                else calcPriceDisplay.style.fontSize = '3rem';
            }, 200);
        }
        
        // Listeners for changes
        calcService.addEventListener('change', updatePrice);
        calcPackages.forEach(p => p.addEventListener('change', updatePrice));
        
        btnNGN.addEventListener('click', (e) => {
            e.preventDefault();
            currentCurrency = 'NGN';
            btnNGN.style.background = 'var(--color-gold)';
            btnNGN.style.color = '#000';
            btnUSD.style.background = 'transparent';
            btnUSD.style.color = 'var(--color-text-main)';
            updatePrice();
        });
        
        btnUSD.addEventListener('click', (e) => {
            e.preventDefault();
            currentCurrency = 'USD';
            btnUSD.style.background = 'var(--color-gold)';
            btnUSD.style.color = '#000';
            btnNGN.style.background = 'transparent';
            btnNGN.style.color = 'var(--color-text-main)';
            updatePrice();
        });
        
        // Action Buttons
        const generateWaLink = (isNegotiation) => {
            if (!pricingData) return '#';
            
            const serviceKey = calcService.value;
            let packageKey = 'standard';
            calcPackages.forEach(p => { if(p.checked) packageKey = p.value; });
            
            let serviceName = '';
            let priceText = calcPriceDisplay.textContent;
            
            if (serviceKey === 'other') {
                serviceName = calcOtherServiceInput.value.trim() || 'Custom Request';
                priceText = 'custom pricing';
            } else {
                serviceName = pricingData.services[serviceKey].name;
            }
            
            const message = `Hello Orbit Tech, I saw the ${packageKey.toUpperCase()} package for ${serviceName} is estimated at ${priceText}. I am very interested, but I would like to negotiate the price and terms. Can we discuss this?`;
            return `https://wa.me/2348106932689?text=${encodeURIComponent(message)}`;
        };
        
        btnStartProject.addEventListener('click', () => {
            if (!pricingData) return;
            
            const serviceKey = calcService.value;
            let packageKey = 'standard';
            calcPackages.forEach(p => { if(p.checked) packageKey = p.value; });
            
            let serviceName = '';
            let priceText = calcPriceDisplay.textContent;
            
            if (serviceKey === 'other') {
                serviceName = calcOtherServiceInput.value.trim() || 'Custom Request';
                priceText = 'custom pricing';
            } else {
                serviceName = pricingData.services[serviceKey].name;
            }

            // Scroll to Contact / Quote section
            const quoteSection = document.getElementById('quote');
            if (quoteSection) {
                quoteSection.scrollIntoView({ behavior: 'smooth' });
                
                // Pre-fill the project details input
                const messageInput = document.getElementById('message');
                if (messageInput) {
                    messageInput.value = `I am interested in starting my project! \n\nService: ${serviceName}\nPackage: ${packageKey.toUpperCase()}\nEstimated Price: ${priceText}\n\nPlease let me know the next steps.`;
                    
                    // Small visual flash to draw attention
                    messageInput.style.backgroundColor = 'rgba(255,215,0,0.1)';
                    setTimeout(() => messageInput.style.backgroundColor = '', 2000);
                }
            }
        });

        
        btnNegotiate.addEventListener('click', () => {
            window.open(generateWaLink(true), '_blank');
        });

        initCalculator();
    }
});










