<!DOCTYPE html>
<html lang="es">

<head>

    <!-- Google Tag Manager -->
    <script>(function (w, d, s, l, i) {
            w[l] = w[l] || []; w[l].push({
                'gtm.start':
                    new Date().getTime(), event: 'gtm.js'
            }); var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                    'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', 'GTM-MZZSNCKT');</script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eurodeco - Fábrica de Sofás Premium</title>
    <link rel="icon" type="image/svg+xml"
        href="https://media.swipepages.com/622f30e72ada4c0010fe3f23%2Ffavicon%2FEurodeco%20Isologo.svg">
    <link rel="shortcut icon" type="image/svg+xml"
        href="https://media.swipepages.com/622f30e72ada4c0010fe3f23%2Ffavicon%2FEurodeco%20Isologo.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/miroles" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-orange: #f28b36;
            --text-dark: #1a1a1a;
            --text-gray: #666;
            --bg-light: #f6f6f6;
            --bg-dark: #353434;
            --font-body: 'Poppins', sans-serif;
            --font-heading: 'Miroles', serif;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: var(--font-body);
            color: var(--text-dark);
            line-height: 1.6;
            overflow-x: hidden;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            font-family: var(--font-heading);
            font-weight: 600;
        }

        h3,
        h4,
        h5,
        h6,
        p {
            font-family: var(--font-body);
        }

        /* Artificial accents for Miroles font - properly positioned */
        .accent {
            position: relative;
            display: inline-block;
        }

        .accent::before {
            content: '\0301';
            /* Combining acute accent */
            position: absolute;
            left: 50%;
            top: 0.42em;
            transform: translateX(-40%);
            font-size: 1em;
            line-height: 0;
            pointer-events: none;
        }

        /* Adjust for different sizes */
        h1 .accent::before {
            top: 0.38em;
            transform: translateX(-40%);
        }

        h2 .accent::before {
            top: 0.4em;
            transform: translateX(-40%);
        }

        h3 .accent::before {
            top: 0.42em;
            transform: translateX(-40%);
        }

        /* Lightbox */
        .lightbox {
            display: none;
            position: fixed;
            z-index: 9999;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            align-items: center;
            justify-content: center;
        }

        .lightbox.active {
            display: flex;
        }

        .lightbox-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
        }

        .lightbox-content img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .lightbox-close {
            position: absolute;
            top: 20px;
            right: 30px;
            color: #fff;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            transition: color 0.3s;
        }

        .lightbox-close:hover {
            color: var(--primary-orange);
        }

        .lightbox-prev,
        .lightbox-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: #fff;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            padding: 10px 20px;
            transition: color 0.3s;
            user-select: none;
        }

        .lightbox-prev {
            left: 20px;
        }

        .lightbox-next {
            right: 20px;
        }

        .lightbox-prev:hover,
        .lightbox-next:hover {
            color: var(--primary-orange);
        }

        /* Mobile Sidebar */
        .mobile-sidebar {
            position: fixed;
            top: 0;
            right: -100%;
            width: 300px;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            z-index: 9999;
            padding: 80px 30px 30px;
            transition: right 0.3s ease;
            overflow-y: auto;
        }

        .mobile-sidebar.active {
            right: 0;
        }

        .mobile-sidebar-close {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 30px;
            color: #fff;
            cursor: pointer;
            background: none;
            border: none;
        }

        .mobile-sidebar nav {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .mobile-sidebar a {
            color: #fff;
            text-decoration: none;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 1.1rem;
            transition: color 0.3s;
        }

        .mobile-sidebar a:hover {
            color: var(--primary-orange);
        }

        .mobile-sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }

        .mobile-sidebar-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Fade in animations */
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* Lightbox transitions */
        .lightbox {
            transition: opacity 0.3s ease;
            opacity: 0;
        }

        .lightbox.active {
            opacity: 1;
        }

        .lightbox-content {
            animation: lightboxZoom 0.3s ease;
        }

        @keyframes lightboxZoom {
            from {
                transform: scale(0.8);
                opacity: 0;
            }

            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        .container {
            max-width: 1180px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header */
        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            padding: 20px 0;
            z-index: 1000;
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
        }

        .logo {
            height: 50px;
            transition: height 0.3s ease;
        }

        header.scrolled .logo {
            height: 40px;
        }

        .nav-menu {
            display: flex;
            list-style: none;
            gap: 2rem;
        }

        .nav-menu a {
            color: #fff;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }

        .nav-menu a:hover {
            color: var(--primary-orange);
        }

        .mobile-toggle {
            display: none;
            flex-direction: column;
            gap: 5px;
            background: none;
            border: none;
            cursor: pointer;
        }

        .mobile-toggle span {
            width: 25px;
            height: 3px;
            background: #fff;
            transition: all 0.3s;
        }

        /* Hero Section */
        .hero {
            margin-top: 0;
            min-height: 90vh;
            background: url('https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/4-2500.webp');
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            color: #fff;
            padding: 90px 30px;
            position: relative;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.65);
            z-index: 1;
        }

        .hero .container {
            position: relative;
            z-index: 2;
            text-align: left;
            max-width: 1000px;
            margin-left: 60px;
        }

        .hero h1 {
            font-size: 6rem;
            margin-bottom: 2rem;
            line-height: 1.1;
            font-weight: 700;
        }

        .hero p {
            font-size: 2rem;
            margin-bottom: 3rem;
            max-width: 700px;
            line-height: 1.5;
        }

        .hero-content {
            max-width: 600px;
        }

        .hero h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }

        .hero h5 {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            font-weight: 400;
        }

        .hero-divider {
            height: 3px;
            width: 90%;
            background: #fff;
            margin: 2rem 0;
        }

        /* Buttons */
        .btn {
            display: inline-block;
            padding: 16px 42px;
            border-radius: 0;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
            border: 1px solid;
        }

        .btn-primary {
            background: #000;
            color: #fff;
            border-color: #000;
        }

        .btn-primary:hover {
            background: var(--primary-orange);
            color: #000;
            border-color: var(--primary-orange);
        }

        .btn-secondary {
            background: #fff;
            color: #000;
            border-color: #fff;
        }

        .btn-secondary:hover {
            background: var(--primary-orange);
            color: #000;
            border-color: var(--primary-orange);
        }

        /* Hero CTA Button */
        .btn-hero-cta {
            background: #fff !important;
            color: #000 !important;
            border-color: #fff !important;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateZ(0);
        }

        .btn-hero-cta::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: var(--primary-orange);
            transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: -1;
        }

        .btn-hero-cta:hover {
            color: #000 !important;
            border-color: var(--primary-orange) !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(242, 139, 54, 0.3);
        }

        .btn-hero-cta:hover::before {
            left: 0;
        }

        /* Section Styles */
        section {
            padding: 90px 0;
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 3rem;
        }

        .section-dark {
            background: var(--bg-dark);
            color: #fff;
        }

        .section-light {
            background: var(--bg-light);
        }

        /* Models Section */
        .model {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            align-items: center;
            margin-bottom: 5rem;
        }

        .model:nth-child(even) {
            direction: rtl;
        }

        .model:nth-child(even)>* {
            direction: ltr;
        }

        .model-images {
            position: relative;
        }

        .model-main-image {
            width: 100%;
            border-radius: 10px;
            margin-bottom: 1rem;
            cursor: pointer;
            transition: transform 0.3s;
        }

        .model-main-image:hover {
            transform: scale(1.02);
        }

        .model-thumbnails {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
        }

        .model-thumbnail {
            width: 100%;
            border-radius: 5px;
            cursor: pointer;
            transition: transform 0.3s;
        }

        .model-thumbnail:hover {
            transform: scale(1.05);
        }

        .model-info h2 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
        }

        .model-info p {
            font-size: 1.125rem;
            margin-bottom: 2rem;
            color: #fff;
        }

        /* About Section */
        .about-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 3rem;
            align-items: center;
        }

        .about-content h2 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
        }

        .about-content p {
            font-size: 1.125rem;
            margin-bottom: 1.5rem;
        }

        .about-logo {
            padding: 3rem;
            border-radius: 10px;
            text-align: center;
        }

        .about-logo img {
            max-width: 150px;
            margin-bottom: 2rem;
        }

        .social-links {
            margin-top: 2rem;
        }

        .social-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin: 0 0.5rem;
            color: #fff;
            transition: transform 0.3s;
        }

        .social-icon:hover {
            transform: scale(1.1);
        }

        /* Features Section */
        .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature {
            text-align: center;
            padding: 2rem;
        }

        .feature h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }

        .feature p {
            color: var(--text-gray);
        }

        /* Textiles Gallery */
        .textiles-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-top: 2rem;
        }

        .textile-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
            object-position: center;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.3s;
        }

        .textile-image:hover {
            transform: scale(1.05);
        }

        /* Contact Section */
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3rem;
            margin-top: 3rem;
        }

        .contact-form {
            background: #fff;
            padding: 2rem;
            border-radius: 10px;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #fff;
            font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #385173;
            border-radius: 5px;
            font-family: inherit;
            font-size: 1rem;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-orange);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }

        .showroom {
            color: #fff;
        }

        .showroom h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #fff;
        }

        .showroom p {
            margin-bottom: 0.5rem;
        }

        .showroom strong {
            color: #fff;
            font-size: 1.25rem;
        }

        .divider {
            height: 2px;
            background: #efefef;
            margin: 2rem 0;
        }

        /* Footer */
        footer {
            background: var(--bg-dark);
            color: #fff;
            padding: 3rem 0;
            text-align: center;
        }

        .footer-content {
            max-width: 600px;
            margin: 0 auto;
        }

        .footer-content h2 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
        }

        .footer-social {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
        }

        .footer-text {
            margin-top: 3rem;
            font-size: 0.875rem;
            color: #999;
        }

        .footer-text a {
            color: var(--primary-orange);
            text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .hero h1 {
                font-size: 2.5rem;
            }

            .model {
                grid-template-columns: 1fr;
            }

            .about-grid {
                grid-template-columns: 1fr;
            }

            .features-grid {
                grid-template-columns: 1fr;
            }

            .textiles-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .contact-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            .nav-menu {
                display: none;
            }

            .mobile-toggle {
                display: flex;
            }

            .logo {
                height: 35px;
            }

            header.scrolled .logo {
                height: 28px;
            }

            .hero {
                padding: 60px 20px;
            }

            .hero .container {
                margin-left: 0;
                padding: 0 20px;
                max-width: 100%;
            }

            .hero h1 {
                font-size: 2.5rem;
            }

            .hero p {
                font-size: 1.25rem;
                max-width: 100%;
            }

            .hero h5 {
                font-size: 1.125rem;
            }

            .model-thumbnails {
                grid-template-columns: repeat(2, 1fr);
            }

            .textiles-grid {
                grid-template-columns: 1fr;
            }

            section {
                padding: 60px 0;
            }

            /* Vanguardista section mobile responsive */
            section[style*="padding: 90px 0; background: #fff;"] {
                padding: 60px 20px !important;
            }

            section[style*="padding: 90px 0; background: #fff;"] .container {
                padding: 0 !important;
            }

            section[style*="padding: 90px 0; background: #fff;"] div[style*="position: relative"] {
                min-height: 400px;
            }

            section[style*="padding: 90px 0; background: #fff;"] h2 {
                font-size: 1.5rem !important;
                padding: 1rem !important;
                line-height: 1.4 !important;
            }

            section[style*="padding: 90px 0; background: #fff;"] div[style*="display: flex"] {
                gap: 1rem !important;
            }

            section[style*="padding: 90px 0; background: #fff;"] .social-icon svg {
                width: 36px !important;
                height: 36px !important;
            }
        }
    </style>
</head>

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17918873129"></script>
<script> window.dataLayer = window.dataLayer || []; function gtag() { dataLayer.push(arguments); } gtag('js', new Date()); gtag('config', 'AW-17918873129'); </script>

<body>


    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MZZSNCKT" height="0" width="0"
            style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->


    <!-- Header -->
    <header>
        <nav class="container">
            <img src="https://media.swipepages.com/2024/10/622f73612ada4c0010fe4626/eurodeco-logotipo-750.webp"
                alt="Eurodeco" class="logo">
            <ul class="nav-menu" id="navMenu">
                <li><a href="#somos">Somos Eurodeco</a></li>
                <li><a href="#modelos">Nuestros Modelos</a></li>
                <li><a href="#contacto">Contacto</a></li>
            </ul>
            <button class="mobile-toggle" id="mobileToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </nav>
    </header>

    <!-- Mobile Sidebar -->
    <div class="mobile-sidebar-overlay" id="mobileSidebarOverlay"></div>
    <div class="mobile-sidebar" id="mobileSidebar">
        <button class="mobile-sidebar-close" id="mobileSidebarClose">&times;</button>
        <nav>
            <a href="#somos">Somos Eurodeco</a>
            <a href="#modelos">Nuestros Modelos</a>
            <a href="#contacto">Contacto</a>
        </nav>
    </div>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>F<span class="accent">a</span>brica de <nobr>Sof<span class="accent">a</span>s</nobr> Premium</h1>
                <div class="hero-divider"></div>
                <h5>Disfrutamos la magia de combinar los materiales de la más alta calidad con las mejores técnicas
                    artesanales para crear piezas únicas en belleza y confort.</h5>
                <a href="#mas" class="btn btn-hero-cta">más información</a>
            </div>
        </div>
    </section>

    <!-- Models Section -->
    <section id="modelos" class="section-dark">
        <div class="container">
            <!-- Chesterfield -->
            <div class="model">
                <div class="model-info">
                    <h2>Chesterfield</h2>
                    <p>Un diseño clásico y elegante que transformamos en contemporáneo y confortable. Con brazos más
                        amplios, líneas más modernas y la mejor selección de colores en cueros y telas.</p>
                    <a href="#contacto" class="btn btn-secondary">consultar</a>
                </div>
                <div class="model-images">
                    <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c4.png"
                        alt="Chesterfield" class="model-main-image">
                    <div class="model-thumbnails">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c4.png"
                            alt="Chesterfield" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c3-gacksa.png"
                            alt="Chesterfield" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/chester-nuevo-1.png"
                            alt="Chesterfield" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/chester-nuevo-2.png"
                            alt="Chesterfield" class="model-thumbnail">
                    </div>
                </div>
            </div>

            <!-- Constructor -->
            <div class="model">
                <div class="model-info">
                    <h2>Constructor</h2>
                    <p>Un Chesterfield en su versión más descontracturada, que combina a la perfección con ambientes
                        industriales y contemporáneos.</p>
                    <a href="#contacto" class="btn btn-secondary">consultar</a>
                </div>
                <div class="model-images">
                    <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co3-5ovigy.png"
                        alt="Constructor" class="model-main-image">
                    <div class="model-thumbnails">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co3-5ovigy.png"
                            alt="Constructor" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co2-fihxyf.png"
                            alt="Constructor" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co1-8znpxk.png"
                            alt="Constructor" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/constructor-new.png"
                            alt="Constructor" class="model-thumbnail">
                    </div>
                </div>
            </div>

            <!-- Buckingham -->
            <div class="model">
                <div class="model-info">
                    <h2>Buckingham</h2>
                    <p>Verlo es evocar un ambiente francés, sofisticado y sensual que destaca en cualquier living sea
                        clásico o moderno.</p>
                    <a href="#contacto" class="btn btn-secondary">consultar</a>
                </div>
                <div class="model-images">
                    <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b4.png"
                        alt="Buckingham" class="model-main-image">
                    <div class="model-thumbnails">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b4.png"
                            alt="Buckingham" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b3-2alwz2.png"
                            alt="Buckingham" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b1-wd1nn4.png"
                            alt="Buckingham" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/buck-new.png"
                            alt="Buckingham" class="model-thumbnail">
                    </div>
                </div>
            </div>

            <!-- Lancaster -->
            <div class="model">
                <div class="model-info">
                    <h2>Lancaster</h2>
                    <p>Excepcionalmente lujoso tanto en su versión de brazo recto como curvo. La profundidad de sus
                        asientos y respaldo con almohadones altos y mullidos lo convierten en uno de los modelos
                        favoritos para los que priorizan el confort.</p>
                    <a href="#contacto" class="btn btn-secondary">consultar</a>
                </div>
                <div class="model-images">
                    <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l4.png"
                        alt="Lancaster" class="model-main-image">
                    <div class="model-thumbnails">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l4.png"
                            alt="Lancaster" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l2-kkgxzv.png"
                            alt="Lancaster" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l1-hxbwe2.png"
                            alt="Lancaster" class="model-thumbnail">
                        <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/lancaster-new.png"
                            alt="Lancaster" class="model-thumbnail">
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="somos">
        <div class="container">
            <div class="about-grid">
                <div class="about-content">
                    <h2>Somos especialistas en Cuero</h2>
                    <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/1.jpg"
                        alt="Cuero" style="width: 100%; border-radius: 10px; margin: 2rem 0;">
                    <p><strong>Te ofrecemos la más amplia selección de cuero vacuno certificado con más de 60 colores,
                            texturas y acabados finales.</strong> Trabajamos cuero vacuno certificado con técnicas
                        artesanales que respetan y realzan su esencia natural destacando el carácter único y distintivo
                        de cada pieza.</p>
                </div>
                <div class="about-logo"
                    style="background: url('https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/fondo-modificado.png'); background-size: cover; background-position: center; position: relative;">
                    <div
                        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); border-radius: 10px;">
                    </div>
                    <div style="position: relative; z-index: 2;">
                        <img src="https://media.swipepages.com/2024/10/622f73612ada4c0010fe4626/svg-logo.webp"
                            alt="Eurodeco Logo">
                        <h2 style="color: #fff; margin-bottom: 1rem;">Seguinos</h2>
                        <p style="color: #fff; margin-bottom: 1.5rem;">En nuestras redes para conocer nuestros nuevos
                            lanzamientos y promociones</p>
                        <div class="social-links">
                            <a href="https://www.facebook.com/Eurodecoflorida/" class="social-icon">
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/eurodecoflorida" class="social-icon">
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="mas" class="section-light">
        <div class="container">
            <h2 class="section-title" style="text-transform: uppercase; letter-spacing: 2px;">¿POR QUÉ ELEGIRNOS?</h2>
            <div class="features-grid">
                <div class="feature">
                    <h3>Fabricantes líderes en el rubro</h3>
                    <p><strong>Podemos hacer realidad el modelo de sofá con el que siempre soñaste.</strong></p>
                    <p>Elegí las medidas, tapizado, configuraciones de almohadones, tachas y patas y nosotros hacemos
                        realidad tu diseño.</p>
                </div>
                <div class="feature">
                    <h3>Garant<span class="accent">i</span>a estructural de por vida</h3>
                    <p>La cuidada selección de materiales y nuestra producción artesanal, personalizada y de alta
                        calidad, nos permiten ofrecer una <strong>garantía estructural de por vida</strong> en cada uno
                        de nuestros sofás.</p>
                </div>
                <div class="feature">
                    <h3>Entrega sin cargo en todo el país*</h3>
                    <p style="font-size: 0.875rem;">(Excepto Tierra del Fuego, Antártida e Islas Malvinas)</p>
                    <p>Nos ocupamos de que tu sofá llegue desde nuestra fábrica hasta tu living de forma segura, simple
                        y sin costos adicionales.</p>
                    <p>En la zona del AMBA realizamos entregas a domicilio.</p>
                    <p style="font-size: 0.875rem;">*En el interior del país, lo despachamos a la sucursal de Vía Cargo
                        más cercana al domicilio del cliente.</p>
                    <p><strong>Tu única preocupación será disfrutarlo.</strong></p>
                </div>
            </div>
        </div>
    </section>

    <!-- Textiles Section -->
    <section class="section-dark">
        <div class="container">
            <h2 class="section-title" style="color: #fff;">Amplia Variedad de Textiles</h2>
            <p style="text-align: center; color: #fff; font-size: 1.125rem; margin-bottom: 2rem;">Además de cuero vacuno
                certificado, trabajamos con las telas de más alta calidad como Lino, Pana, Chenille, Talampaya, jean.
            </p>
            <div class="textiles-grid">
                <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0897.jpg"
                    alt="Textile" class="textile-image">
                <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0967--1-.jpg"
                    alt="Textile" class="textile-image">
                <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0917.jpg"
                    alt="Textile" class="textile-image">
                <img src="https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0623.jpg"
                    alt="Textile" class="textile-image">
            </div>
            <div style="text-align: center; margin-top: 3rem;">
                <a href="#contacto" class="btn btn-secondary">consultar</a>
            </div>
            <p style="text-align: center; color: #fff; font-size: 0.875rem; margin-top: 2rem;"><u>IMPORTANTE</u>: el
                cuero es un material natural. Pueden existir variaciones de color y textura entre partidas. Estas
                diferencias no afectan la calidad ni se consideran fallas.</p>
        </div>
    </section>

    <!-- Download Catalog Section -->
    <section style="background: #000; padding: 60px 0;">
        <div class="container" style="text-align: center;">
            <h2 style="color: #fff; font-size: 2.5rem; margin-bottom: 2rem;">Descargá Nuestro Catálogo</h2>
            <a href="https://thecrewserver.com/eurodeco/catalogo-eurodeco.pdf" class="btn"
                style="background: #fff; color: #000; border-color: #fff; text-transform: uppercase;">descargar</a>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contacto"
        style="background: url('https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/fondo-modificado.png'); background-size: cover; background-position: center; padding: 90px 0; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6);"></div>
        <div class="container" style="position: relative; z-index: 2;">
            <div style="text-align: center; margin-bottom: 3rem;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #fff;">Cont<span class="accent">a</span>ctanos
                </h2>
                <p style="color: #fff; font-size: 1.125rem;">Nuestros profesionales te acompañan en el proceso de elegir
                    el modelo que más se ajuste a tus deseos y necesidades, ofreciéndote la mejor financiación</p>
            </div>

            <div class="contact-grid">
                <div class="contact-form"
                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 3rem; text-align: center;">
                    <div style="margin-bottom: 2rem;">
                        <svg width="80" height="80" fill="#25D366" viewBox="0 0 24 24" style="margin-bottom: 1.5rem;">
                            <path
                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <h3 style="color: #fff; font-size: 2rem; margin-bottom: 1rem; font-family: var(--font-heading);">
                        ¡Cont<span class="accent">a</span>ctanos por WhatsApp!</h3>
                    <p style="color: #fff; margin-bottom: 2rem; font-size: 1.125rem;">Nuestros profesionales te
                        acompañan en el proceso de elegir el modelo que más se ajuste a tus deseos y necesidades</p>
                    <a href="https://wa.me/5491162088078" target="_blank" class="btn btn-primary"
                        style="display: inline-flex; align-items: center; gap: 10px; background: #25D366; border-color: #25D366; text-decoration: none;">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Abrir WhatsApp
                    </a>
                </div>

                <div class="showroom">
                    <div class="divider" style="background: rgba(255,255,255,0.3);"></div>
                    <h3 style="text-transform: uppercase;">SHOWROOM BUENOS AIRES</h3>
                    <p><strong>+54 9 11 6208 8078</strong></p>
                    <p>San Martin 3432 Florida Oeste</p>
                    <div class="divider" style="background: rgba(255,255,255,0.3);"></div>
                </div>

                <div class="showroom">
                    <div class="divider" style="background: rgba(255,255,255,0.3);"></div>
                    <h3 style="text-transform: uppercase;">SHOWROOM BAHÍA BLANCA</h3>
                    <p><strong>+54 9 291 468 9243</strong></p>
                    <p>Dorrego 532 Complejo Cronos Local 7 (CP 8001)</p>
                    <div class="divider" style="background: rgba(255,255,255,0.3);"></div>
                </div>
            </div>
        </div>
    </section>

    <!-- Vanguardista Section -->
    <section style="padding: 90px 0; background: #fff;">
        <div class="container" style="max-width: 1000px;">
            <div style="position: relative; border-radius: 10px; overflow: hidden;">
                <img src="https://eurodecofloridacom.swipepages.media/2022/3/622f73612ada4c0010fe4626/hero-1500.webp"
                    alt="Eurodeco Furniture" style="width: 100%; height: auto; display: block;">
                <div
                    style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center;">
                    <h2 style="font-size: 2.5rem; color: #fff; margin-bottom: 2rem; line-height: 1.3;">Creamos un toque
                        vanguardista en los diseños clásicos que más nos gustan</h2>
                    <div style="display: flex; gap: 2rem; align-items: center; justify-content: center;">
                        <a href="https://www.facebook.com/Eurodecoflorida/" class="social-icon"
                            style="color: #fff; transition: color 0.3s;">
                            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>
                        <a href="https://www.instagram.com/eurodecoflorida" class="social-icon"
                            style="color: #fff; transition: color 0.3s;">
                            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer style="background: #000; padding: 30px 0;">
        <div class="container">
            <div style="text-align: center;">
                <p style="color: #fff; margin: 0;">Eurodeco Florida © 2022 - <a href="https://surcodia.com"
                        target="_blank" style="color: var(--primary-orange); text-decoration: none;">Diseño web</a> por
                    <a href="https://surcodia.com" target="_blank"
                        style="color: var(--primary-orange); text-decoration: none;">Surcodia</a>
                </p>
            </div>
        </div>
    </footer>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox">
        <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
        <span class="lightbox-prev" onclick="changeLightboxImage(-1)">&#10094;</span>
        <span class="lightbox-next" onclick="changeLightboxImage(1)">&#10095;</span>
        <div class="lightbox-content">
            <img id="lightbox-img" src="" alt="">
        </div>
    </div>

    <script>
        // Mobile menu toggle - open sidebar
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileSidebar = document.getElementById('mobileSidebar');
        const mobileSidebarClose = document.getElementById('mobileSidebarClose');
        const mobileSidebarOverlay = document.getElementById('mobileSidebarOverlay');

        mobileToggle.addEventListener('click', () => {
            mobileSidebar.classList.add('active');
            mobileSidebarOverlay.classList.add('active');
        });

        mobileSidebarClose.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            mobileSidebarOverlay.classList.remove('active');
        });

        mobileSidebarOverlay.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            mobileSidebarOverlay.classList.remove('active');
        });

        // Close sidebar when clicking on a link
        document.querySelectorAll('.mobile-sidebar a').forEach(link => {
            link.addEventListener('click', () => {
                mobileSidebar.classList.remove('active');
                mobileSidebarOverlay.classList.remove('active');
            });
        });

        // Fade in animations on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Add fade-in class to sections
        document.querySelectorAll('section, .model, .feature-card').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Logo scroll animation
        const header = document.querySelector('header');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });

        // Lightbox functionality
        let currentImageIndex = 0;
        let lightboxImages = [];

        function openLightbox(imgSrc, imgArray) {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');

            lightboxImages = imgArray;
            currentImageIndex = lightboxImages.indexOf(imgSrc);

            lightboxImg.src = imgSrc;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function changeLightboxImage(direction) {
            currentImageIndex += direction;

            if (currentImageIndex >= lightboxImages.length) {
                currentImageIndex = 0;
            } else if (currentImageIndex < 0) {
                currentImageIndex = lightboxImages.length - 1;
            }

            document.getElementById('lightbox-img').src = lightboxImages[currentImageIndex];
        }

        // Close lightbox on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                changeLightboxImage(-1);
            } else if (e.key === 'ArrowRight') {
                changeLightboxImage(1);
            }
        });

        // Close lightbox when clicking outside image
        document.getElementById('lightbox').addEventListener('click', (e) => {
            if (e.target.id === 'lightbox') {
                closeLightbox();
            }
        });

        // Attach lightbox to all model images
        const chesterfieldImages = [
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c4.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c1.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c2.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c3.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/c5.png'
        ];

        const constructorImages = [
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co3-5ovigy.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co1.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co2.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co4.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/co5.png'
        ];

        const buckinghamImages = [
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b4.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b1.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b2.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b3.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/b5.png'
        ];

        const lancasterImages = [
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l4.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l1.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l2.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l3.png',
            'https://eurodecofloridacom.swipepages.media/2022/4/622f73612ada4c0010fe4626/l5.png'
        ];

        const textileImages = [
            'https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0897.jpg',
            'https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0967--1-.jpg',
            'https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0917.jpg',
            'https://eurodecofloridacom.swipepages.media/2022/9/622f73612ada4c0010fe4626/copia-de-dsc_0623.jpg'
        ];

        // Add click handlers to all images
        document.querySelectorAll('.model-main-image').forEach((img, index) => {
            img.addEventListener('click', () => {
                let imageArray;
                if (index === 0) imageArray = chesterfieldImages;
                else if (index === 1) imageArray = constructorImages;
                else if (index === 2) imageArray = buckinghamImages;
                else if (index === 3) imageArray = lancasterImages;

                openLightbox(img.src, imageArray);
            });
        });

        document.querySelectorAll('.model-thumbnail').forEach((img) => {
            img.addEventListener('click', () => {
                const modelSection = img.closest('.model');
                const modelIndex = Array.from(document.querySelectorAll('.model')).indexOf(modelSection);

                let imageArray;
                if (modelIndex === 0) imageArray = chesterfieldImages;
                else if (modelIndex === 1) imageArray = constructorImages;
                else if (modelIndex === 2) imageArray = buckinghamImages;
                else if (modelIndex === 3) imageArray = lancasterImages;

                openLightbox(img.src, imageArray);
            });
        });

        document.querySelectorAll('.textile-image').forEach((img) => {
            img.addEventListener('click', () => {
                openLightbox(img.src, textileImages);
            });
        });
    </script>

    <!-- Cliengo Customization -->
    <script>
        window.cliengoCustoms = {
            // Brand colors matching Eurodeco design
            primaryColor: '#f28b36',        // Your orange accent
            secondaryColor: '#000000',      // Your black
            backgroundColor: '#ffffff',      // White background
            textColor: '#1a1a1a',          // Your dark text

            // Position - bottom right to replace WhatsApp position
            position: 'bottom-right',

            // Chat behavior
            autoOpen: false,                // Don't auto-open, let users initiate
            welcomeMessage: '¡Hola! Bienvenido a Eurodeco. Somos expertos en sofás premium. ¿En qué puedo ayudarte?',

            // Button styling to match your design
            buttonStyle: {
                backgroundColor: '#f28b36',
                textColor: '#ffffff',
                borderRadius: '0px',           // Square corners to match your style
                fontSize: '14px',
                fontFamily: 'Poppins, sans-serif',
                border: '2px solid #f28b36'
            },

            // Chat window styling
            chatWindowStyle: {
                headerColor: '#f28b36',
                headerTextColor: '#ffffff',
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '0px',
                borderColor: '#f28b36'
            },

            // Input field styling
            inputStyle: {
                borderRadius: '0px',
                borderColor: '#f28b36',
                fontFamily: 'Poppins, sans-serif'
            }
        };
    </script>

    <!-- WhatsApp floating button -->
    <style>
        .wa-float {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 9000;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
        .wa-bubble {
            background: #fff;
            color: #1a1a1a;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            font-weight: 500;
            padding: 8px 14px;
            border-radius: 18px 18px 18px 4px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            white-space: nowrap;
            animation: wa-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both, wa-fade-out 0.4s ease 4s forwards;
            transform-origin: bottom left;
        }
        @keyframes wa-pop {
            from { opacity: 0; transform: scale(0.6) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wa-fade-out {
            from { opacity: 1; }
            to   { opacity: 0; pointer-events: none; }
        }
        .wa-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #25D366;
            box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            transition: transform 0.2s, box-shadow 0.2s;
            text-decoration: none;
        }
        .wa-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 24px rgba(0,0,0,0.32);
        }
    </style>
    <div class="wa-float">
        <div class="wa-bubble">¿Necesitás ayuda?</div>
        <a href="https://wa.me/5491162088078?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20sof%C3%A1s%20de%20Eurodeco."
            target="_blank" rel="noopener" class="wa-btn" aria-label="Contactar por WhatsApp">
            <svg width="28" height="28" fill="#fff" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        </a>
    </div>

    <!-- Cliengo Chatbot Installation Code -->
    <script
        type="text/javascript">(function () { var ldk = document.createElement('script'); ldk.type = 'text/javascript'; ldk.async = true; ldk.src = 'https://s.cliengo.com/weboptimizer/627027692c124a002a33f4b3/69bafa1046cfa569036e50a6.js?platform=onboarding_modular'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ldk, s); })();</script>
</body>

</html>