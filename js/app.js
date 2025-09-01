import { getState, updateState, resetState } from './stateManager.js';
import * as UIManager from './uiManager.js';
import * as CalibrationEngine from './calibrationEngine.js';
import { generatePDF } from './pdfGenerator.js';

// --- INICIALIZACIÓN Y REGISTRO DE EVENTOS ---

/**
 * Función principal que se ejecuta cuando el DOM está listo.
 */
function main() {
    registerEventListeners();
    registerPWA();
}

/**
 * Asigna todos los event listeners de la aplicación.
 */
function registerEventListeners() {
    UIManager.elements.instrumentForm.addEventListener('submit', handleInstrumentFormSubmit);
    UIManager.elements.validateBtn.addEventListener('click', handleValidation);
    UIManager.elements.backToDataBtn.addEventListener('click', () => UIManager.navigateToStep('step1'));
    UIManager.elements.generatePdfBtn.addEventListener('click', handlePdfGeneration);
    UIManager.elements.fullResetBtn.addEventListener('click', handleFullReset);
    
    // Validación en tiempo real para LRV y URV
    UIManager.elements.lrvInput.addEventListener('input', validateLrvUrv);
    UIManager.elements.urvInput.addEventListener('input', validateLrvUrv);
}

/**
 * Registra el Service Worker para la PWA.
 */
function registerPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('Service Worker registrado con éxito:', registration))
                .catch(error => console.log('Error en el registro del Service Worker:', error));
        });
    }
}

// --- MANEJADORES DE EVENTOS ---

/**
 * Maneja el envío del formulario de datos del instrumento.
 */
function handleInstrumentFormSubmit(e) {
    e.preventDefault();
    UIManager.hideError();

    if (!validateLrvUrv()) return;
    
    const instrumentData = UIManager.getInstrumentData();
    const span = instrumentData.urv - instrumentData.lrv;
    const errorThreshold = span * (instrumentData.tolerance / 100);

    updateState({ instrumentData, span, errorThreshold });

    const { lrv, urv, pvUnit } = instrumentData;
    const idealPoints = CalibrationEngine.calculateCalibrationPoints(lrv, urv);
    const equation = CalibrationEngine.calculateLinearEquation(lrv, urv);
    
    updateState({ 
        calibrationData: { ...getState().calibrationData, ideal: idealPoints },
        equation
    });
    
    UIManager.renderCalibrationTable(idealPoints, pvUnit);
    UIManager.navigateToStep('step2');
}

/**
 * Maneja la validación de los datos de calibración.
 */
function handleValidation() {
    if (!UIManager.validateMeasuredInputs()) {
        UIManager.showError('Por favor, ingrese todos los valores medidos en campo.');
        return;
    }
    UIManager.hideError();

    const measuredPoints = UIManager.getMeasuredData();
    const { ideal } = getState().calibrationData;
    const { errorThreshold } = getState();
    
    const errors = CalibrationEngine.calculateErrors(ideal, measuredPoints);
    const isApproved = CalibrationEngine.checkIfApproved(errors, errorThreshold);

    updateState({
        calibrationData: { ...getState().calibrationData, measured: measuredPoints, errors },
        isApproved
    });

    UIManager.renderErrors(errors, errorThreshold);
    prepareAndShowReport();
    UIManager.navigateToStep('step3');
}

/**
 * Prepara los datos y actualiza la UI para el reporte final.
 */
function prepareAndShowReport() {
    const { instrumentData, isApproved, equation } = getState();
    const summaryData = {
        tag: instrumentData.tag,
        isApproved,
        date: new Date().toLocaleString(),
        equation: equation.formatted
    };
    UIManager.updateReportView(summaryData);
    UIManager.updateChart(instrumentData);
}

/**
 * Maneja la generación del PDF.
 */
async function handlePdfGeneration() {
    UIManager.toggleLoader(UIManager.elements.generatePdfBtn, true);
    try {
        // Usamos un pequeño delay para que el spinner sea visible y mejore la UX
        await new Promise(resolve => setTimeout(resolve, 50)); 
        const state = getState();
        const chartInstance = UIManager.getChartInstance();
        generatePDF(state, chartInstance);
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        UIManager.showError("Hubo un problema al generar el reporte PDF.");
    } finally {
        UIManager.toggleLoader(UIManager.elements.generatePdfBtn, false);
    }
}

/**
 * Reinicia la aplicación a su estado inicial.
 */
function handleFullReset() {
    resetState();
    UIManager.resetUI();
    UIManager.navigateToStep('step1');
}

// --- FUNCIONES DE VALIDACIÓN AUXILIARES ---

/**
 * Valida que LRV sea menor que URV en tiempo real.
 * @returns {boolean} - True si es válido, false si no.
 */
function validateLrvUrv() {
    const lrv = parseFloat(UIManager.elements.lrvInput.value);
    const urv = parseFloat(UIManager.elements.urvInput.value);
    
    if (!isNaN(lrv) && !isNaN(urv) && lrv >= urv) {
        UIManager.showError('El Valor Mínimo (LRV) debe ser menor que el Valor Máximo (URV).');
        UIManager.elements.lrvInput.classList.add('input-error');
        UIManager.elements.urvInput.classList.add('input-error');
        return false;
    }
    
    UIManager.hideError();
    UIManager.elements.lrvInput.classList.remove('input-error');
    UIManager.elements.urvInput.classList.remove('input-error');
    return true;
}


// --- PUNTO DE ENTRADA DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', main);
