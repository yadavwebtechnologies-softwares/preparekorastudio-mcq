
"use strict";

/* =========================================
   Preparekora MCQ Studio
   High-Resolution Image Export
========================================= */

(() => {

    const $ = (id) => document.getElementById(id);

    const elements = {
        poster: $("poster"),

        downloadButton: $("downloadButton"),
        exportButton: $("exportButton"),

        exportOverlay: $("exportOverlay"),
        exportProgressText: $("exportProgressText"),
        exportProgressBar: $("exportProgressBar"),

        exportStatus: $("exportStatus"),
        exportDimensions: $("exportDimensions"),

        exportResolution: $("exportResolution"),
        exportFormat: $("exportFormat"),
        exportQuality: $("exportQuality")
    };


    /* =====================================
       Export Configuration
    ===================================== */

    const CONFIG = {
        maxPixels: 35000000,
        maxDimension: 16000,
        defaultFilename: "preparekora-mcq"
    };

    let isExporting = false;


    /* =====================================
       Progress Overlay
    ===================================== */

    function showOverlay() {

        elements.exportOverlay.hidden = false;

        elements.exportProgressBar.style.width = "0%";

        elements.exportProgressText.textContent =
            "Preparing high-resolution image...";

        document.body.style.overflow = "hidden";
    }

    function hideOverlay() {

        elements.exportOverlay.hidden = true;

        document.body.style.overflow = "";
    }

    function updateProgress(progress, message) {

        const percentage = Math.min(
            100,
            Math.max(0, progress)
        );

        elements.exportProgressBar.style.width =
            `${percentage}%`;

        elements.exportProgressText.textContent = message;
    }

    function delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }


    /* =====================================
       Filename Generation
    ===================================== */

    function getFilename() {

        const editor = window.PreparekoraEditor;

        const imageId = editor
            ? editor.getImageId()
            : "";

        let filename = imageId || CONFIG.defaultFilename;

        filename = filename
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        return filename || CONFIG.defaultFilename;
    }


    /* =====================================
       Export Settings
    ===================================== */

    function getExportSettings() {

        const editor = window.PreparekoraEditor;

        if (!editor) {
            throw new Error("Editor module is not initialized.");
        }

        const dimensions = editor.getCanvasDimensions();
        const settings = editor.getExportSettings();

        const width = Math.round(
            dimensions.width * settings.resolution
        );

        const height = Math.round(
            dimensions.height * settings.resolution
        );

        if (
            !Number.isSafeInteger(width) ||
            !Number.isSafeInteger(height) ||
            width <= 0 ||
            height <= 0
        ) {
            throw new Error("Invalid export dimensions.");
        }

        return {
            width,
            height,
            resolution: settings.resolution,
            format: settings.format,
            quality: settings.quality
        };
    }


    /* =====================================
       Export Validation
    ===================================== */

    function validateExport(settings) {

        if (!elements.poster) {
            throw new Error("Poster element not found.");
        }

        if (typeof html2canvas !== "function") {
            throw new Error(
                "Image export library could not be loaded. Check your internet connection."
            );
        }

        if (
            settings.width > CONFIG.maxDimension ||
            settings.height > CONFIG.maxDimension
        ) {
            throw new Error(
                "Image dimensions exceed the supported maximum of 16,000 pixels per side. Choose a lower resolution."
            );
        }

        const totalPixels = settings.width * settings.height;

        if (totalPixels > CONFIG.maxPixels) {
            throw new Error(
                `This export requires ${(totalPixels / 1000000).toFixed(1)} megapixels. ` +
                `For browser stability, the current limit is 35 megapixels. ` +
                `Choose a lower resolution.`
            );
        }

        const rect = elements.poster.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            throw new Error("Poster preview is not ready.");
        }

        return rect;
    }


    /* =====================================
       Capture Poster
    ===================================== */

    async function capturePoster(settings, rect) {

        updateProgress(
            15,
            "Loading fonts and preparing poster..."
        );

        await document.fonts.ready;

        await delay(150);

        updateProgress(
            30,
            "Rendering poster at high resolution..."
        );

        /*
           The preview canvas is scaled to fit the screen.
           Export scale restores the selected real dimensions.
        */

        const scaleX = settings.width / rect.width;
        const scaleY = settings.height / rect.height;

        const scale = Math.min(scaleX, scaleY);

        const canvas = await html2canvas(elements.poster, {

            scale: scale,

            width: rect.width,
            height: rect.height,

            windowWidth: Math.round(rect.width),
            windowHeight: Math.round(rect.height),

            x: 0,
            y: 0,

            scrollX: 0,
            scrollY: 0,

            backgroundColor: null,

            useCORS: true,
            allowTaint: false,
            logging: false,

            imageTimeout: 15000,

            foreignObjectRendering: false
        });

        updateProgress(
            65,
            "Processing image quality..."
        );

        if (!canvas.width || !canvas.height) {
            throw new Error("Unable to render the poster.");
        }

        /*
           Verify the generated canvas dimensions.
           The actual ratio is retained without stretching.
        */

        const expectedRatio =
            settings.width / settings.height;

        const actualRatio =
            canvas.width / canvas.height;

        if (Math.abs(expectedRatio - actualRatio) > 0.002) {
            throw new Error(
                "Generated image dimensions do not match the selected canvas ratio."
            );
        }

        return canvas;
    }


    /* =====================================
       Convert Canvas to Blob
    ===================================== */

    function canvasToBlob(canvas, format, quality) {

        return new Promise((resolve, reject) => {

            const mimeType = format === "webp"
                ? "image/webp"
                : "image/png";

            canvas.toBlob(
                (blob) => {

                    if (!blob) {
                        reject(
                            new Error("Image conversion failed.")
                        );

                        return;
                    }

                    if (
                        format === "webp" &&
                        blob.type !== "image/webp"
                    ) {
                        reject(
                            new Error("Your browser does not support WebP export.")
                        );

                        return;
                    }

                    resolve(blob);
                },

                mimeType,

                format === "webp"
                    ? quality
                    : undefined
            );

        });
    }


    /* =====================================
       Download Image
    ===================================== */

    async function downloadBlob(blob, filename, format) {

        const extension = format === "webp"
            ? "webp"
            : "png";

        const fileURL = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = fileURL;
        link.download = `${filename}.${extension}`;
        link.style.display = "none";

        document.body.appendChild(link);

        try {

            link.click();

        } finally {

            link.remove();

            setTimeout(() => {
                URL.revokeObjectURL(fileURL);
            }, 60000);

        }
    }


    /* =====================================
       Export Status
    ===================================== */

    function setExportStatus(message, isError = false) {

        if (!elements.exportStatus) return;

        elements.exportStatus.textContent = message;

        elements.exportStatus.style.color = isError
            ? "#bd4141"
            : "#888";
    }


    /* =====================================
       Refresh Image ID
    ===================================== */

    function prepareNextImage() {

        const editor = window.PreparekoraEditor;

        if (!editor || typeof editor.advanceImageId !== "function") {
            return;
        }

        /*
           Reserve the next monthly ID only after
           the current image has been downloaded.
        */

        editor.advanceImageId();
    }


    /* =====================================
       Main Export Function
    ===================================== */

    async function exportImage() {

        if (isExporting) return;

        isExporting = true;

        const buttons = [
            elements.downloadButton,
            elements.exportButton
        ];

        const originalLabels = buttons.map(button =>
            button ? button.textContent : ""
        );

        buttons.forEach(button => {
            if (button) button.disabled = true;
        });

        if (elements.downloadButton) {
            elements.downloadButton.textContent = "Preparing...";
        }

        if (elements.exportButton) {
            elements.exportButton.textContent = "Preparing...";
        }

        showOverlay();

        try {

            const settings = getExportSettings();

            const posterRect = validateExport(settings);

            const filename = getFilename();

            const qrUrl = window.PreparekoraEditor.getQRUrl();

            if (!qrUrl) {
                throw new Error(
                    "Please enter a valid QR code destination URL before exporting."
                );
            }

            updateProgress(
                10,
                "Checking image dimensions..."
            );

            await delay(100);

            const canvas = await capturePoster(
                settings,
                posterRect
            );

            updateProgress(
                75,
                "Creating downloadable image..."
            );

            const blob = await canvasToBlob(
                canvas,
                settings.format,
                settings.quality
            );

            updateProgress(
                90,
                "Preparing download..."
            );

            await delay(150);

            await downloadBlob(
                blob,
                filename,
                settings.format
            );

            /*
               Release rendering memory.
            */

            canvas.width = 1;
            canvas.height = 1;

            updateProgress(
                100,
                "Image exported successfully."
            );

            setExportStatus(
                `Exported ${filename} successfully.`
            );

            /*
               Move to the next monthly ID.
            */

            prepareNextImage();

            await delay(450);

        } catch (error) {

            console.error("Image export error:", error);

            setExportStatus(
                error.message || "Image export failed.",
                true
            );

            updateProgress(
                100,
                "Export failed."
            );

            alert(
                error.message ||
                "Unable to export image. Please try again."
            );

        } finally {

            hideOverlay();

            buttons.forEach((button, index) => {

                if (!button) return;

                button.disabled = false;

                button.textContent = originalLabels[index];
            });

            isExporting = false;
        }
    }


    /* =====================================
       Button Events
    ===================================== */

    function initializeExport() {

        if (elements.downloadButton) {
            elements.downloadButton.addEventListener(
                "click",
                exportImage
            );
        }

        if (elements.exportButton) {
            elements.exportButton.addEventListener(
                "click",
                exportImage
            );
        }

        console.log("Preparekora export module initialized.");
    }


    /* =====================================
       Initialize
    ===================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeExport,
            { once: true }
        );

    } else {

        initializeExport();

    }

})();
