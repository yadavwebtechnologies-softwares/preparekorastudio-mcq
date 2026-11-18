"use strict";

/* =========================================
   Preparekora MCQ Studio
   Editor & ID Management
========================================= */

(() => {

    /* =====================================
       DOM Elements
    ===================================== */

    const $ = (id) => document.getElementById(id);

    const elements = {
        brandName: $("brandName"),
        brandDomain: $("brandDomain"),
        mcqId: $("mcqId"),
        subjectName: $("subjectName"),
        questionText: $("questionText"),

        optionA: $("optionA"),
        optionB: $("optionB"),
        optionC: $("optionC"),
        optionD: $("optionD"),

        commentsTitle: $("commentsTitle"),
        commentsText: $("commentsText"),
        qrUrl: $("qrUrl"),

        previewBrandName: $("previewBrandName"),
        previewBrandDomain: $("previewBrandDomain"),
        previewMcqId: $("previewMcqId"),
        previewSubject: $("previewSubject"),
        previewQuestion: $("previewQuestion"),

        previewOptionA: $("previewOptionA"),
        previewOptionB: $("previewOptionB"),
        previewOptionC: $("previewOptionC"),
        previewOptionD: $("previewOptionD"),

        previewCommentsTitle: $("previewCommentsTitle"),
        previewCommentsText: $("previewCommentsText"),

        previewQrCode: $("previewQrCode"),

        aspectRatio: $("aspectRatio"),
        customSizeFields: $("customSizeFields"),
        customWidth: $("customWidth"),
        customHeight: $("customHeight"),

        canvasDimensions: $("canvasDimensions"),
        canvasRatioLabel: $("canvasRatioLabel"),
        canvasBackground: $("canvasBackground"),
        canvasBackgroundValue: $("canvasBackgroundValue"),

        previewSize: $("previewSize"),
        previewAspectLabel: $("previewAspectLabel"),
        poster: $("poster"),

        exportResolution: $("exportResolution"),
        exportDimensions: $("exportDimensions"),
        exportFormat: $("exportFormat"),
        exportFormatLabel: $("exportFormatLabel"),
        exportQuality: $("exportQuality"),
        qualityValue: $("qualityValue"),
        qualityField: $("qualityField"),

        saveStatus: $("saveStatus"),

        manualIdToggle: $("manualIdToggle"),
        manualIdStatus: $("manualIdStatus")
    };


    /* =====================================
       Storage Helpers
    ===================================== */

    const STORAGE_KEYS = {
        activeId: "preparekora_mcq_active_id",
        sequencePrefix: "preparekora_mcq_sequence_"
    };

    function storageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn("Local storage unavailable:", error);
            return null;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch (error) {
            console.warn("Unable to save local data:", error);
        }
    }


    /* =====================================
       Automatic Image ID
       
       Format: PR/MM/0001

       PR = Global prefix
       MM = Current month
       0001 = Monthly image sequence
    ===================================== */

    const ID_PREFIX = "PR";

    let activeGeneratedId = "";
    let fallbackSequence = {};

    function getCurrentMonth() {
        return String(new Date().getMonth() + 1).padStart(2, "0");
    }

    function getSequenceKey(month) {
        return STORAGE_KEYS.sequencePrefix + month;
    }

    function reserveNextImageId() {

        const month = getCurrentMonth();
        const sequenceKey = getSequenceKey(month);

        let nextNumber = Number(storageGet(sequenceKey));

        if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
            nextNumber = fallbackSequence[month] || 1;
        }

        const formattedNumber = String(nextNumber).padStart(4, "0");

        const nextSequence = nextNumber + 1;

        storageSet(sequenceKey, nextSequence);
        fallbackSequence[month] = nextSequence;

        return `${ID_PREFIX}/${month}/${formattedNumber}`;
    }

    function getSavedActiveId() {

        const savedId = storageGet(STORAGE_KEYS.activeId);
        const currentMonth = getCurrentMonth();

        const pattern = /^PR\/(\d{2})\/(\d{4,})$/;
        const match = savedId ? savedId.match(pattern) : null;

        if (match && match[1] === currentMonth) {
            return savedId;
        }

        return "";
    }

    function initializeImageId() {

        activeGeneratedId = getSavedActiveId();

        if (!activeGeneratedId) {
            activeGeneratedId = reserveNextImageId();

            storageSet(
                STORAGE_KEYS.activeId,
                activeGeneratedId
            );
        }

        elements.mcqId.value = activeGeneratedId;
        elements.mcqId.readOnly = true;

        updatePreviewField(
            elements.previewMcqId,
            activeGeneratedId
        );
    }

    function advanceImageId() {

        activeGeneratedId = reserveNextImageId();

        storageSet(
            STORAGE_KEYS.activeId,
            activeGeneratedId
        );

        elements.mcqId.value = activeGeneratedId;

        updatePreviewField(
            elements.previewMcqId,
            activeGeneratedId
        );

        updateSaveStatus("Ready");
    }


    /* =====================================
       Manual ID Editing
    ===================================== */

    function initializeManualIdControl() {

        elements.manualIdToggle.checked = false;
        elements.mcqId.readOnly = true;

        elements.manualIdToggle.addEventListener("change", () => {

            const enabled = elements.manualIdToggle.checked;

            elements.mcqId.readOnly = !enabled;

            if (enabled) {

                elements.manualIdStatus.textContent =
                    "Manual editing enabled. You can now edit the image ID.";

                elements.mcqId.focus();

            } else {

                elements.mcqId.value = activeGeneratedId;

                elements.manualIdStatus.textContent =
                    "Manual editing disabled. Image ID is automatically managed.";

                updatePreviewField(
                    elements.previewMcqId,
                    activeGeneratedId
                );
            }
        });

        elements.mcqId.addEventListener("input", () => {

            updatePreviewField(
                elements.previewMcqId,
                elements.mcqId.value
            );

            updateSaveStatus("Editing...");
        });
    }


    /* =====================================
       Preview Text Helper
    ===================================== */

    function updatePreviewField(element, value) {

        if (!element) return;

        element.textContent = value.trim();
    }


    /* =====================================
       Live Content Editor
    ===================================== */

    function initializeContentEditor() {

        const bindings = [
            [elements.brandName, elements.previewBrandName],
            [elements.brandDomain, elements.previewBrandDomain],
            [elements.subjectName, elements.previewSubject],
            [elements.questionText, elements.previewQuestion],

            [elements.optionA, elements.previewOptionA],
            [elements.optionB, elements.previewOptionB],
            [elements.optionC, elements.previewOptionC],
            [elements.optionD, elements.previewOptionD],

            [elements.commentsTitle, elements.previewCommentsTitle],
            [elements.commentsText, elements.previewCommentsText]
        ];

        bindings.forEach(([input, preview]) => {

            if (!input || !preview) return;

            const update = () => {

                updatePreviewField(
                    preview,
                    input.value
                );

                updateSaveStatus("Editing...");
            };

            input.addEventListener("input", update);

            update();
        });

        elements.mcqId.addEventListener("input", () => {

            updatePreviewField(
                elements.previewMcqId,
                elements.mcqId.value
            );
        });
    }


    /* =====================================
       QR Code Generation
    ===================================== */

    let lastValidQrUrl = "";

    function generateQRCode() {

        const urlValue = elements.qrUrl.value.trim();

        if (!urlValue || !elements.previewQrCode) return false;

        let validUrl;

        try {
            validUrl = new URL(urlValue);

            if (
                validUrl.protocol !== "https:" &&
                validUrl.protocol !== "http:"
            ) {
                throw new Error("Only HTTP and HTTPS URLs are supported.");
            }

        } catch (error) {

            elements.previewQrCode.innerHTML = "";

            const message = document.createElement("span");

            message.textContent = "Invalid URL";
            message.style.fontSize = "9px";
            message.style.color = "#999";

            elements.previewQrCode.appendChild(message);

            return false;
        }

        if (typeof QRCode === "undefined") {

            console.error("QR Code library not loaded.");
            return false;
        }

        lastValidQrUrl = validUrl.href;

        elements.previewQrCode.innerHTML = "";

        new QRCode(elements.previewQrCode, {
            text: lastValidQrUrl,
            width: 54,
            height: 54,
            correctLevel: QRCode.CorrectLevel.H
        });

        return true;
    }

    function initializeQRCode() {

        generateQRCode();

        elements.qrUrl.addEventListener("change", generateQRCode);

        elements.qrUrl.addEventListener("blur", generateQRCode);
    }


    /* =====================================
       Aspect Ratio Presets
    ===================================== */

    const ASPECT_PRESETS = {

        "1:1": {
            width: 1080,
            height: 1080
        },

        "16:9": {
            width: 1920,
            height: 1080
        },

        "9:16": {
            width: 1080,
            height: 1920
        },

        "4:3": {
            width: 1440,
            height: 1080
        },

        "3:4": {
            width: 1080,
            height: 1440
        }

    };

    let canvasWidth = 1440;
    let canvasHeight = 1080;

    let currentAspectRatio = "4:3";

    function getRatioLabel(width, height) {

        const divisor = greatestCommonDivisor(width, height);

        const ratioWidth = width / divisor;
        const ratioHeight = height / divisor;

        return `${ratioWidth}:${ratioHeight}`;
    }

    function greatestCommonDivisor(a, b) {

        a = Math.round(a);
        b = Math.round(b);

        while (b) {
            const remainder = a % b;
            a = b;
            b = remainder;
        }

        return a || 1;
    }


    /* =====================================
       Preview Canvas Dimensions
    ===================================== */

    function updateCanvasPreview() {

        const maxPreviewWidth = 540;
        const maxPreviewHeight = 540;

        const scale = Math.min(
            maxPreviewWidth / canvasWidth,
            maxPreviewHeight / canvasHeight
        );

        const previewWidth = Math.round(canvasWidth * scale);
        const previewHeight = Math.round(canvasHeight * scale);

        elements.poster.style.width = `${previewWidth}px`;
        elements.poster.style.height = `${previewHeight}px`;

        elements.poster.style.setProperty(
            "--poster-preview-scale",
            scale
        );

        elements.canvasDimensions.textContent =
            `${canvasWidth} × ${canvasHeight} px`;

        elements.previewSize.textContent =
            `${canvasWidth} × ${canvasHeight}`;

        elements.previewAspectLabel.textContent =
            currentAspectRatio === "custom"
                ? "Custom"
                : currentAspectRatio;

        elements.canvasRatioLabel.textContent =
            `${getRatioLabel(canvasWidth, canvasHeight)} aspect ratio`;

    }


    /* =====================================
       Export Dimension Information
    ===================================== */

    function updateExportInformation() {

        const resolution = Number(elements.exportResolution.value) || 2;

        const outputWidth = canvasWidth * resolution;
        const outputHeight = canvasHeight * resolution;

        elements.exportDimensions.textContent =
            `${outputWidth.toLocaleString("en-IN")} × ${outputHeight.toLocaleString("en-IN")} px`;

        const format = elements.exportFormat.value;

        elements.exportFormatLabel.textContent =
            format.toUpperCase();

        elements.qualityField.hidden = format !== "webp";
    }


    /* =====================================
       Custom Canvas Dimensions
    ===================================== */

    function updateCustomCanvas() {

        const width = Number(elements.customWidth.value);
        const height = Number(elements.customHeight.value);

        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width < 100 ||
            height < 100 ||
            width > 12000 ||
            height > 12000
        ) {
            return;
        }

        canvasWidth = width;
        canvasHeight = height;
        currentAspectRatio = "custom";

        updateCanvasPreview();
        updateExportInformation();
        updateSaveStatus("Canvas updated");
    }


    /* =====================================
       Aspect Ratio Controller
    ===================================== */

    function initializeCanvasSettings() {

        elements.aspectRatio.addEventListener("change", () => {

            const selectedRatio = elements.aspectRatio.value;

            currentAspectRatio = selectedRatio;

            if (selectedRatio === "custom") {

                elements.customSizeFields.hidden = false;

                updateCustomCanvas();

            } else {

                elements.customSizeFields.hidden = true;

                const preset = ASPECT_PRESETS[selectedRatio];

                if (!preset) return;

                canvasWidth = preset.width;
                canvasHeight = preset.height;

                updateCanvasPreview();
                updateExportInformation();

                updateSaveStatus("Canvas updated");
            }
        });

        elements.customWidth.addEventListener(
            "input",
            updateCustomCanvas
        );

        elements.customHeight.addEventListener(
            "input",
            updateCustomCanvas
        );

        elements.exportResolution.addEventListener(
            "change",
            updateExportInformation
        );

        elements.exportFormat.addEventListener(
            "change",
            updateExportInformation
        );

        elements.exportQuality.addEventListener("input", () => {

            elements.qualityValue.textContent =
                `${elements.exportQuality.value}%`;

        });

        elements.canvasBackground.addEventListener("input", () => {

            const color = elements.canvasBackground.value;

            elements.poster.style.setProperty(
                "--poster-bg",
                color
            );

            elements.canvasBackgroundValue.textContent =
                color.toUpperCase();

            updateSaveStatus("Canvas updated");
        });

        // Initial canvas setup

        elements.aspectRatio.value = "4:3";

        elements.customSizeFields.hidden = true;

        updateCanvasPreview();
        updateExportInformation();

        elements.canvasBackgroundValue.textContent =
            elements.canvasBackground.value.toUpperCase();
    }


    /* =====================================
       Save Status
    ===================================== */

    let statusTimeout = null;

    function updateSaveStatus(message) {

        if (!elements.saveStatus) return;

        elements.saveStatus.textContent = message;

        clearTimeout(statusTimeout);

        statusTimeout = setTimeout(() => {
            elements.saveStatus.textContent = "Ready";
        }, 1800);
    }


    /* =====================================
       Public Editor API
       
       Used by export.js
    ===================================== */

    window.PreparekoraEditor = {

        getImageId() {
            return elements.mcqId.value.trim();
        },

        getGeneratedImageId() {
            return activeGeneratedId;
        },

        advanceImageId,

        generateQRCode,

        getCanvasDimensions() {

            return {
                width: canvasWidth,
                height: canvasHeight,
                aspectRatio: currentAspectRatio
            };
        },

        getExportSettings() {

            return {
                resolution: Number(elements.exportResolution.value),
                format: elements.exportFormat.value,
                quality: Number(elements.exportQuality.value) / 100
            };
        },

        getQRUrl() {
            return lastValidQrUrl;
        },

        updateSaveStatus
    };


    /* =====================================
       Initialize Editor
    ===================================== */

    function initializeEditor() {

        initializeImageId();

        initializeManualIdControl();

        initializeContentEditor();

        initializeQRCode();

        initializeCanvasSettings();

        console.log("Preparekora editor initialized.");
        console.log("Current image ID:", activeGeneratedId);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeEditor, {
            once: true
        });
    } else {
        initializeEditor();
    }

})();
