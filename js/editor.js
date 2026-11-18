"use strict";

/* =========================================
   Preparekora MCQ Studio
   Editor, Auto Detection & ID Management
========================================= */

(() => {

    /* =====================================
       DOM Elements
    ===================================== */

    const $ = (id) => document.getElementById(id);

    const elements = {

        // New simplified interface
        bulkContent: $("bulkContent"),
        previewButton: $("previewButton"),
        previewStatus: $("previewStatus"),
        exportButton: $("exportButton"),
        currentIdMonth: $("currentIdMonth"),

        // Hidden content fields
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

        // Poster preview
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
        previewPanel: $("previewPanel"),

        // Canvas settings
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

        // Export settings
        exportResolution: $("exportResolution"),
        exportDimensions: $("exportDimensions"),
        exportFormat: $("exportFormat"),
        exportFormatLabel: $("exportFormatLabel"),
        exportQuality: $("exportQuality"),
        qualityValue: $("qualityValue"),
        qualityField: $("qualityField"),

        // Status
        saveStatus: $("saveStatus"),
        exportStatus: $("exportStatus"),

        // ID settings
        manualIdToggle: $("manualIdToggle"),
        manualIdStatus: $("manualIdStatus")
    };


    /* =====================================
       Storage Helpers
    ===================================== */

    const STORAGE_KEYS = {

        activeId: "preparekora_mcq_active_id",

        activePeriod: "preparekora_mcq_active_period",

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
       0001 = Monthly sequence

       Sequence storage uses YYYY-MM
       so every new calendar month
       starts independently from 0001.
    ===================================== */

    const ID_PREFIX = "PR";

    let activeGeneratedId = "";

    let activePeriod = "";

    let fallbackSequence = {};


    function getCurrentMonth() {

        return String(
            new Date().getMonth() + 1
        ).padStart(2, "0");
    }


    function getCurrentPeriod() {

        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        return `${year}-${month}`;
    }


    function getSequenceKey(period) {

        return STORAGE_KEYS.sequencePrefix + period;
    }


    function reserveNextImageId() {

        const period = getCurrentPeriod();

        const month = getCurrentMonth();

        const sequenceKey = getSequenceKey(period);

        let nextNumber = Number(
            storageGet(sequenceKey)
        );


        // Migrate the previous monthly counter
        // when updating an existing installation.

        if (
            (!Number.isSafeInteger(nextNumber) || nextNumber < 1) &&
            !storageGet(STORAGE_KEYS.activePeriod)
        ) {

            const legacyKey =
                STORAGE_KEYS.sequencePrefix + month;

            const legacyNumber = Number(
                storageGet(legacyKey)
            );

            if (
                Number.isSafeInteger(legacyNumber) &&
                legacyNumber > 0
            ) {

                nextNumber = legacyNumber;
            }
        }


        if (
            !Number.isSafeInteger(nextNumber) ||
            nextNumber < 1
        ) {

            nextNumber = fallbackSequence[period] || 1;
        }


        const formattedNumber = String(
            nextNumber
        ).padStart(4, "0");


        const nextSequence = nextNumber + 1;


        storageSet(sequenceKey, nextSequence);

        storageSet(
            STORAGE_KEYS.activePeriod,
            period
        );

        fallbackSequence[period] = nextSequence;

        activePeriod = period;


        return `${ID_PREFIX}/${month}/${formattedNumber}`;
    }


    function getSavedActiveId() {

        const savedId = storageGet(
            STORAGE_KEYS.activeId
        );

        const currentMonth = getCurrentMonth();

        const currentPeriod = getCurrentPeriod();

        const pattern = /^PR\/(\d{2})\/(\d{4,})$/;

        const match = savedId
            ? savedId.match(pattern)
            : null;


        if (!match || match[1] !== currentMonth) {

            return "";
        }


        const savedPeriod = storageGet(
            STORAGE_KEYS.activePeriod
        );


        if (savedPeriod && savedPeriod !== currentPeriod) {

            return "";
        }


        // Support an older installation
        // that did not save the year-month period.

        if (!savedPeriod) {

            storageSet(
                STORAGE_KEYS.activePeriod,
                currentPeriod
            );
        }


        activePeriod = currentPeriod;

        return savedId;
    }


    function updateCurrentMonthLabel() {

        if (elements.currentIdMonth) {

            elements.currentIdMonth.textContent =
                getCurrentMonth();
        }
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

        updateCurrentMonthLabel();
    }


    function synchronizeMonthlyId() {

        const currentPeriod = getCurrentPeriod();

        if (activePeriod === currentPeriod) {

            return;
        }


        activeGeneratedId = reserveNextImageId();

        storageSet(
            STORAGE_KEYS.activeId,
            activeGeneratedId
        );


        // Do not overwrite an emergency manual edit.

        if (!elements.manualIdToggle.checked) {

            elements.mcqId.value = activeGeneratedId;

            updatePreviewField(
                elements.previewMcqId,
                activeGeneratedId
            );
        }


        updateCurrentMonthLabel();

        updateSaveStatus("New monthly ID generated");
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

        updateCurrentMonthLabel();

        updateSaveStatus("Ready");
    }


    /* =====================================
       Manual ID Editing
    ===================================== */

    function initializeManualIdControl() {

        elements.manualIdToggle.checked = false;

        elements.mcqId.readOnly = true;


        elements.manualIdToggle.addEventListener(
            "change",
            () => {

                const enabled =
                    elements.manualIdToggle.checked;


                elements.mcqId.readOnly = !enabled;


                if (enabled) {

                    elements.manualIdStatus.textContent =
                        "Manual editing enabled. You can now edit the image ID.";

                    elements.mcqId.focus();

                } else {

                    synchronizeMonthlyId();

                    elements.mcqId.value =
                        activeGeneratedId;

                    elements.manualIdStatus.textContent =
                        "Manual editing disabled. Image ID is automatically managed.";


                    updatePreviewField(
                        elements.previewMcqId,
                        activeGeneratedId
                    );
                }
            }
        );


        elements.mcqId.addEventListener(
            "input",
            () => {

                updatePreviewField(
                    elements.previewMcqId,
                    elements.mcqId.value
                );

                invalidatePreview();

                updateSaveStatus("Editing...");
            }
        );
    }


    /* =====================================
       Preview Text Helper
    ===================================== */

    function updatePreviewField(element, value) {

        if (!element) return;

        element.textContent = String(value ?? "").trim();
    }


    /* =====================================
       Live Content Editor
    ===================================== */

    const contentBindings = [

        ["brandName", "previewBrandName"],

        ["brandDomain", "previewBrandDomain"],

        ["subjectName", "previewSubject"],

        ["questionText", "previewQuestion"],

        ["optionA", "previewOptionA"],

        ["optionB", "previewOptionB"],

        ["optionC", "previewOptionC"],

        ["optionD", "previewOptionD"],

        ["commentsTitle", "previewCommentsTitle"],

        ["commentsText", "previewCommentsText"]

    ];


    function refreshPosterContent() {

        contentBindings.forEach(([inputId, previewId]) => {

            const input = elements[inputId];

            const preview = elements[previewId];

            if (!input || !preview) return;

            updatePreviewField(
                preview,
                input.value
            );
        });


        updatePreviewField(
            elements.previewMcqId,
            elements.mcqId.value
        );
    }


    function initializeContentEditor() {

        contentBindings.forEach(([inputId, previewId]) => {

            const input = elements[inputId];

            if (!input) return;

            input.addEventListener("input", () => {

                refreshPosterContent();

                invalidatePreview();

                updateSaveStatus("Editing...");
            });
        });


        elements.mcqId.addEventListener("input", () => {

            updatePreviewField(
                elements.previewMcqId,
                elements.mcqId.value
            );

            invalidatePreview();
        });


        refreshPosterContent();
    }


    /* =====================================
       MCQ FORMAT AUTO DETECTION

       Supported example:

       Subject: Reasoning

       Q: Book is related to Reading
       in the same way as Food is related to?

       A) Cooking
       B) Eating
       C) Kitchen
       D) Buying

       Ans: B
    ===================================== */

    function parseMCQFormat(rawText) {

        const result = {

            subject: "",

            question: "",

            options: {
                A: "",
                B: "",
                C: "",
                D: ""
            },

            answer: ""

        };


        if (!rawText || !rawText.trim()) {

            return result;
        }


        const lines = rawText
            .replace(/\r/g, "")
            .split("\n");


        const questionLines = [];

        const fallbackQuestionLines = [];


        let questionStarted = false;

        let activeOption = null;


        const subjectPattern =
            /^\s*(?:Subject|Topic)\s*[:：-]\s*(.*)$/i;


        const questionPattern =
            /^\s*(?:Q(?:uestion)?\s*\d*)\s*[:：.)-]\s*(.*)$/i;


        const answerPattern =
            /^\s*(?:Ans(?:wer)?|Correct\s*Answer)\s*[:：-]\s*(.*)$/i;


        const optionPattern =
            /^\s*(?:Option\s+([A-D])\s*[:.)-]|(?:\(([A-D])\)|\[([A-D])\]|([A-D])\s*[\).:：-]))\s*(.*)$/i;


        for (const originalLine of lines) {

            const line = originalLine.trim();

            if (!line) continue;


            // Subject detection

            const subjectMatch =
                line.match(subjectPattern);

            if (subjectMatch) {

                result.subject =
                    subjectMatch[1].trim();

                activeOption = null;

                continue;
            }


            // Answer detection

            const answerMatch =
                line.match(answerPattern);

            if (answerMatch) {

                result.answer =
                    answerMatch[1].trim();

                activeOption = null;

                continue;
            }


            // Question detection

            const questionMatch =
                line.match(questionPattern);

            if (questionMatch) {

                questionStarted = true;

                activeOption = null;


                if (questionMatch[1].trim()) {

                    questionLines.push(
                        questionMatch[1].trim()
                    );
                }

                continue;
            }


            // Option detection

            const optionMatch =
                line.match(optionPattern);

            if (optionMatch) {

                const letter =
                    optionMatch[1] ||
                    optionMatch[2] ||
                    optionMatch[3] ||
                    optionMatch[4];


                activeOption = letter.toUpperCase();


                result.options[activeOption] =
                    optionMatch[5].trim();

                continue;
            }


            // Continuation of a question

            if (questionStarted && !activeOption) {

                if (!subjectMatch) {

                    questionLines.push(line);
                }

                continue;
            }


            // Continuation of a multi-line option

            if (activeOption) {

                result.options[activeOption] +=
                    (result.options[activeOption] ? " " : "") +
                    line;

                continue;
            }


            // Fallback question text
            // for formats without a Q: label.

            if (
                !/^\s*(?:Direction|Time|Marks|Subject|Topic)\s*[:：-]/i.test(line)
            ) {

                fallbackQuestionLines.push(line);
            }
        }


        result.question = (
            questionLines.length
                ? questionLines
                : fallbackQuestionLines
        ).join(" ").trim();


        return result;
    }


    /* =====================================
       Apply Detected MCQ Data
    ===================================== */

    function applyDetectedContent(parsed) {

        if (!parsed) return;


        if (parsed.subject) {

            elements.subjectName.value =
                parsed.subject;
        }


        if (parsed.question) {

            elements.questionText.value =
                parsed.question;
        }


        ["A", "B", "C", "D"].forEach((letter) => {

            const optionValue =
                parsed.options[letter];

            if (optionValue) {

                elements["option" + letter].value =
                    optionValue;
            }
        });


        refreshPosterContent();
    }


    /* =====================================
       Paste Format Listener
    ===================================== */

    function initializeBulkContent() {

        elements.bulkContent.addEventListener(
            "input",
            () => {

                const parsed = parseMCQFormat(
                    elements.bulkContent.value
                );


                applyDetectedContent(parsed);


                invalidatePreview();

                updateSaveStatus("Content detected");
            }
        );


        // Automatically capture the initial example.

        const initialContent = parseMCQFormat(
            elements.bulkContent.value
        );

        applyDetectedContent(initialContent);
    }


    /* =====================================
       QR Code Generation
    ===================================== */

    let lastValidQrUrl = "";


    function clearQRCode() {

        lastValidQrUrl = "";

        if (elements.previewQrCode) {

            elements.previewQrCode.innerHTML = "";
        }
    }


    function generateQRCode(showError = false) {

        clearQRCode();


        const urlValue = elements.qrUrl.value.trim();


        if (!urlValue) {

            return false;
        }


        let validUrl;


        try {

            validUrl = new URL(urlValue);


            if (
                validUrl.protocol !== "https:" &&
                validUrl.protocol !== "http:"
            ) {

                throw new Error(
                    "Only HTTP and HTTPS URLs are supported."
                );
            }

        } catch (error) {

            if (showError) {

                const message =
                    document.createElement("span");

                message.textContent = "Invalid URL";

                message.style.fontSize = "9px";

                message.style.color = "#999";

                elements.previewQrCode.appendChild(message);
            }

            return false;
        }


        if (
            typeof QRCode === "undefined" ||
            !elements.previewQrCode
        ) {

            console.error(
                "QR Code library is not available."
            );

            return false;
        }


        try {

            new QRCode(elements.previewQrCode, {

                text: validUrl.href,

                width: 54,

                height: 54,

                correctLevel: QRCode.CorrectLevel.H

            });


            lastValidQrUrl = validUrl.href;

            return true;

        } catch (error) {

            console.error(
                "QR generation failed:",
                error
            );

            clearQRCode();

            return false;
        }
    }


    function initializeQRCode() {

        elements.qrUrl.addEventListener(
            "input",
            () => {

                generateQRCode(false);

                invalidatePreview();
            }
        );


        elements.qrUrl.addEventListener(
            "change",
            () => generateQRCode(false)
        );


        elements.qrUrl.addEventListener(
            "blur",
            () => generateQRCode(false)
        );
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


    function getRatioLabel(width, height) {

        const divisor =
            greatestCommonDivisor(width, height);


        return `${width / divisor}:${height / divisor}`;
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


        const previewWidth =
            Math.round(canvasWidth * scale);

        const previewHeight =
            Math.round(canvasHeight * scale);


        elements.poster.style.width =
            `${previewWidth}px`;

        elements.poster.style.height =
            `${previewHeight}px`;


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

        const resolution =
            Number(elements.exportResolution.value) || 2;


        const outputWidth =
            canvasWidth * resolution;

        const outputHeight =
            canvasHeight * resolution;


        elements.exportDimensions.textContent =

            `${outputWidth.toLocaleString("en-IN")} × ${outputHeight.toLocaleString("en-IN")} px`;


        const format =
            elements.exportFormat.value;


        elements.exportFormatLabel.textContent =
            format.toUpperCase();


        elements.qualityField.hidden =
            format !== "webp";
    }


    /* =====================================
       Preview Validation State
    ===================================== */

    let previewConfirmed = false;


    function invalidatePreview() {

        previewConfirmed = false;


        if (elements.exportResolution) {

            elements.exportResolution.disabled = true;
        }


        if (elements.exportButton) {

            elements.exportButton.disabled = true;
        }


        if (elements.previewStatus) {

            elements.previewStatus.textContent =
                "Changes detected. Click Preview image before downloading.";
        }


        if (elements.exportStatus) {

            elements.exportStatus.textContent =
                "Preview your image again before downloading.";
        }
    }


    function setPreviewStatus(message) {

        if (elements.previewStatus) {

            elements.previewStatus.textContent = message;
        }
    }


    /* =====================================
       Preview Button Workflow
    ===================================== */

    function validateMCQContent(parsed) {

        if (!parsed.question) {

            return "Question not detected. Check the Q: line in your format.";
        }


        const missingOptions = ["A", "B", "C", "D"].filter(

            letter => !parsed.options[letter].trim()

        );


        if (missingOptions.length) {

            return (
                "Missing option(s): " +
                missingOptions.join(", ") +
                ". Check your pasted format."
            );
        }


        return "";
    }


    function handlePreview() {

        synchronizeMonthlyId();


        const parsed = parseMCQFormat(
            elements.bulkContent.value
        );


        const validationError =
            validateMCQContent(parsed);


        if (validationError) {

            setPreviewStatus(validationError);

            invalidatePreview();

            return;
        }


        // Populate all hidden fields and poster content.

        applyDetectedContent(parsed);


        // Generate a fresh QR code from the supplied URL.

        if (!generateQRCode(true)) {

            setPreviewStatus(
                "Enter a valid QR destination URL and try again."
            );

            invalidatePreview();

            return;
        }


        refreshPosterContent();


        previewConfirmed = true;


        // Unlock the next workflow steps.

        elements.exportResolution.disabled = false;

        elements.exportButton.disabled = false;


        updateExportInformation();


        setPreviewStatus(
            "Preview ready. Select your resolution and download the image."
        );


        if (elements.exportStatus) {

            elements.exportStatus.textContent =
                "Your image is ready to export.";
        }


        updateSaveStatus("Preview ready");


        // Bring the preview into view on smaller screens.

        if (elements.previewPanel) {

            elements.previewPanel.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });
        }
    }


    function initializePreviewWorkflow() {

        elements.previewButton.addEventListener(
            "click",
            handlePreview
        );


        // Resolution becomes available only
        // after a successful preview.

        elements.exportResolution.disabled = true;

        elements.exportButton.disabled = true;
    }


    /* =====================================
       Custom Canvas Dimensions
    ===================================== */

    function updateCustomCanvas() {

        const width =
            Number(elements.customWidth.value);

        const height =
            Number(elements.customHeight.value);


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

        elements.aspectRatio.addEventListener(
            "change",
            () => {

                const selectedRatio =
                    elements.aspectRatio.value;


                currentAspectRatio = selectedRatio;


                if (selectedRatio === "custom") {

                    elements.customSizeFields.hidden = false;

                    updateCustomCanvas();

                } else {

                    elements.customSizeFields.hidden = true;


                    const preset =
                        ASPECT_PRESETS[selectedRatio];


                    if (!preset) return;


                    canvasWidth = preset.width;

                    canvasHeight = preset.height;


                    updateCanvasPreview();

                    updateExportInformation();

                    updateSaveStatus("Canvas updated");
                }


                invalidatePreview();
            }
        );


        elements.customWidth.addEventListener(
            "input",
            () => {

                updateCustomCanvas();

                invalidatePreview();
            }
        );


        elements.customHeight.addEventListener(
            "input",
            () => {

                updateCustomCanvas();

                invalidatePreview();
            }
        );


        elements.exportResolution.addEventListener(
            "change",
            updateExportInformation
        );


        elements.exportFormat.addEventListener(
            "change",
            () => {

                updateExportInformation();

                updateSaveStatus("Export settings updated");
            }
        );


        elements.exportQuality.addEventListener(
            "input",
            () => {

                elements.qualityValue.textContent =
                    `${elements.exportQuality.value}%`;
            }
        );


        elements.canvasBackground.addEventListener(
            "input",
            () => {

                const color =
                    elements.canvasBackground.value;


                elements.poster.style.setProperty(
                    "--poster-bg",
                    color
                );


                elements.canvasBackgroundValue.textContent =
                    color.toUpperCase();


                invalidatePreview();

                updateSaveStatus("Canvas updated");
            }
        );


        // Initial canvas setup.

        elements.aspectRatio.value = "4:3";

        elements.customSizeFields.hidden = true;


        elements.poster.style.setProperty(
            "--poster-bg",
            elements.canvasBackground.value
        );


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

            synchronizeMonthlyId();

            return elements.mcqId.value.trim();
        },


        getGeneratedImageId() {

            return activeGeneratedId;
        },


        advanceImageId,


        generateQRCode() {

            return generateQRCode(true);
        },


        getCanvasDimensions() {

            return {

                width: canvasWidth,

                height: canvasHeight,

                aspectRatio: currentAspectRatio

            };
        },


        getExportSettings() {

            return {

                resolution: Number(
                    elements.exportResolution.value
                ),

                format: elements.exportFormat.value,

                quality: Number(
                    elements.exportQuality.value
                ) / 100

            };
        },


        getQRUrl() {

            return lastValidQrUrl;
        },


        isPreviewReady() {

            return previewConfirmed;
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

        initializeBulkContent();

        initializeQRCode();

        initializeCanvasSettings();

        initializePreviewWorkflow();


        console.log(
            "Preparekora editor initialized."
        );

        console.log(
            "Current image ID:",
            activeGeneratedId
        );
    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeEditor,
            { once: true }
        );

    } else {

        initializeEditor();
    }

})();
