
"use strict";

/* =========================================
   Preparekora MCQ Studio
   Main Application Controller
========================================= */

(() => {

    /* =====================================
       DOM Elements
    ===================================== */

    const $ = (id) => document.getElementById(id);

    const elements = {
        mainNav: $("mainNav"),
        mobileMenuToggle: $("mobileMenuToggle"),
        editorPanel: $("editorPanel"),
        previewPanel: $("previewPanel")
    };

    const navButtons = document.querySelectorAll(
        "[data-section-target]"
    );

    const editorSections = document.querySelectorAll(
        ".editor-section"
    );


    /* =====================================
       Navigation Section Switching
    ===================================== */

    function activateSection(sectionId) {

        const targetSection = $(sectionId);

        if (!targetSection || !targetSection.classList.contains("editor-section")) {
            console.warn("Navigation section not found:", sectionId);
            return;
        }

        // Activate selected section

        editorSections.forEach(section => {

            section.classList.toggle(
                "active",
                section.id === sectionId
            );

        });

        // Update active navigation item

        navButtons.forEach(button => {

            const isActive =
                button.dataset.sectionTarget === sectionId;

            button.classList.toggle("active", isActive);

            button.setAttribute(
                "aria-current",
                isActive ? "page" : "false"
            );

        });

        closeMobileMenu();

        // Bring editor section into view on mobile

        if (window.innerWidth <= 760) {

            elements.editorPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    /* =====================================
       Navigation Event Listeners
    ===================================== */

    function initializeNavigation() {

        navButtons.forEach(button => {

            button.addEventListener("click", () => {

                const sectionId = button.dataset.sectionTarget;

                activateSection(sectionId);

            });

        });

        // Initialize first active section

        const initiallyActiveButton = document.querySelector(
            ".nav-item.active[data-section-target]"
        );

        const initialSection = initiallyActiveButton
            ? initiallyActiveButton.dataset.sectionTarget
            : "contentSection";

        activateSection(initialSection);

    }


    /* =====================================
       Mobile Navigation
    ===================================== */

    function openMobileMenu() {

        if (!elements.mainNav || !elements.mobileMenuToggle) {
            return;
        }

        elements.mainNav.classList.add("open");

        elements.mobileMenuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        elements.mobileMenuToggle.setAttribute(
            "aria-label",
            "Close navigation"
        );

    }


    function closeMobileMenu() {

        if (!elements.mainNav || !elements.mobileMenuToggle) {
            return;
        }

        elements.mainNav.classList.remove("open");

        elements.mobileMenuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        elements.mobileMenuToggle.setAttribute(
            "aria-label",
            "Open navigation"
        );

    }


    function toggleMobileMenu() {

        if (!elements.mainNav) return;

        const isOpen = elements.mainNav.classList.contains("open");

        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }

    }


    function initializeMobileNavigation() {

        if (!elements.mobileMenuToggle) return;

        elements.mobileMenuToggle.addEventListener(
            "click",
            toggleMobileMenu
        );

        // Close when clicking outside the navigation

        document.addEventListener("click", (event) => {

            const isMenuOpen =
                elements.mainNav.classList.contains("open");

            if (!isMenuOpen) return;

            const clickedInsideMenu =
                elements.mainNav.contains(event.target);

            const clickedToggle =
                elements.mobileMenuToggle.contains(event.target);

            if (!clickedInsideMenu && !clickedToggle) {
                closeMobileMenu();
            }

        });

        // Close with Escape key

        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape") {
                closeMobileMenu();
            }

        });

        // Close mobile menu when changing to desktop

        window.addEventListener("resize", () => {

            if (window.innerWidth > 760) {
                closeMobileMenu();
            }

        });

    }


    /* =====================================
       Keyboard Accessibility
    ===================================== */

    function initializeKeyboardSupport() {

        document.addEventListener("keydown", (event) => {

            // Do not intercept shortcuts while typing

            const target = event.target;

            const isTyping =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target.isContentEditable;

            if (isTyping) return;

            // Escape closes mobile navigation

            if (event.key === "Escape") {
                closeMobileMenu();
            }

        });

    }


    /* =====================================
       Application Status
    ===================================== */

    function updateApplicationStatus() {

        const editor = window.PreparekoraEditor;

        if (
            editor &&
            typeof editor.updateSaveStatus === "function"
        ) {
            editor.updateSaveStatus("Ready");
        }

    }


    /* =====================================
       Initialize Application
    ===================================== */

    function initializeApplication() {

        initializeNavigation();

        initializeMobileNavigation();

        initializeKeyboardSupport();

        updateApplicationStatus();

        console.log("--------------------------------");
        console.log("Preparekora MCQ Studio");
        console.log("Application initialized successfully.");
        console.log("--------------------------------");

    }


    /* =====================================
       Start Application
    ===================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeApplication,
            { once: true }
        );

    } else {

        initializeApplication();

    }

})();
