// SPDX-FileCopyrightText: Copyright (C) ARDUINO SRL (http://www.arduino.cc)
//
// SPDX-License-Identifier: MPL-2.0

const recentDetectionsElement = document.getElementById('recentClassifications');
const feedbackContentElement = document.getElementById('feedback-content');
const MAX_RECENT_SCANS = 5;
let scans = [];
const socket = io(`http://${window.location.host}`); 
let errorContainer = document.getElementById('error-container');

// =====================================================================
// 1. DICCIONARIO DE CLASES (Configura aquí tus textos e imágenes)
// Asegúrate de que las llaves ("sanas", "background") estén en MINÚSCULAS
// =====================================================================
const classConfig = {
    "sano": {  
        text: "¡Planta SANA detectada! 🌱",
        img: "https://i.postimg.cc/ZYpBwRRL/planta-ok.gif" // <-- CAMBIA ESTO por tu URL de Postimages o archivo local
    },
    "no_sano": { // Reemplaza con el nombre exacto de tu clase si es distinto
        text: "¡Atención! Planta ENFERMA ⚠️",
        img: "https://i.postimg.cc/W3SKVjbb/planta-bad.gif" // <-- CAMBIA ESTO por tu imagen
    },
    "background": {
        text: "Escaneando entorno...",
        img: "https://i.postimg.cc/bJFTLvNW/vision.gif" 
    },
    "default": {
        text: "Esperando modelo...",
        img: "https://i.postimg.cc/CMRT0BDW/cargando.gif"
    }
};
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    initSocketIO();
    showDetection("default");
    renderClasses();

    // Lógica del ícono de información (Feedback)
    const feedbackPopoverText = "Cuando la cámara detecte una planta, el resultado aparecerá aquí.";
    document.querySelectorAll('.info-btn.feedback').forEach(img => {
        const popover = img.nextElementSibling;
        img.addEventListener('mouseenter', () => {
            popover.textContent = feedbackPopoverText;
            popover.style.display = 'block';
        });
        img.addEventListener('mouseleave', () => {
            popover.style.display = 'none';
        });
    });
});

function initSocketIO() {
    socket.on('connect', () => {
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.textContent = '';
        }
    });

    socket.on('disconnect', () => {
        if (errorContainer) {
            errorContainer.textContent = 'Se perdió la conexión con la tarjeta.';
            errorContainer.style.display = 'block';
        }
    });

    socket.on('classifications', async (message) => {
        printClassifications(message);
        renderClasses();
    });

    socket.on('clima_update', (data) => {
        try {
            // Se espera que Python envíe un JSON como: {"temp": 24.5, "hum": 60.2}
            const sensores = JSON.parse(data);
            document.getElementById('tempValue').textContent = sensores.temp.toFixed(1) + ' °C';
            document.getElementById('humValue').textContent = sensores.hum.toFixed(1) + ' %';
        } catch (e) {
            console.error("Error al procesar datos del clima:", e);
        }
    });
}

let lastChangeTimestamp = 0;
let currentState = 'default';
const UPDATE_INTERVAL = 1500; // 1.5 segundos para no parpadear tan rápido

function printClassifications(newDetection) {
    scans.unshift(newDetection);
    if (scans.length > MAX_RECENT_SCANS) { scans.pop(); }

    try {
        const detections = JSON.parse(newDetection);
        if (!detections || detections.length === 0) return;

        // EXTRAE LA CLASE CON MAYOR NIVEL DE CONFIANZA
        let topDetection = detections.reduce((max, obj) => (obj.confidence > max.confidence) ? obj : max, detections[0]);

        // Convertimos el nombre a minúsculas para buscarlo en nuestro diccionario
        const newState = topDetection.content.toLowerCase();
        const now = Date.now();

        // Si cambió lo que estamos viendo y pasó el tiempo de gracia, actualizamos
        if (newState !== currentState && (now - lastChangeTimestamp > UPDATE_INTERVAL)) {
            showDetection(newState);
            currentState = newState;
            lastChangeTimestamp = now;
        }
    } catch (e) {
        console.error("Error al leer datos:", e);
    }
}

function renderClasses() {
    recentDetectionsElement.innerHTML = ``;

    if (scans.length === 0) {
        recentDetectionsElement.innerHTML = `
            <div class="no-recent-scans">
                <img src="./img/no-face.svg">
                Aún no hay detecciones
            </div>
        `;
        return;
    }

    scans.forEach((iscan) => {
        try {
            const iiscan = JSON.parse(iscan);
            if (iiscan.length === 0) return; 

            iiscan.forEach((scan) => {
                const row = document.createElement('div');
                row.className = 'scan-container';

                const cellContainer = document.createElement('span');
                cellContainer.className = 'scan-cell-container cell-border';

                const contentText = document.createElement('span');
                contentText.className = 'scan-content';
                const value = scan.confidence;
                const result = Math.floor(value * 1000) / 10;
                contentText.innerHTML = `${result}% - ${scan.content}`;

                const timeText = document.createElement('span');
                timeText.className = 'scan-content-time';
                timeText.textContent = new Date(scan.timestamp).toLocaleString('es-ES').replace(',', ' -');

                cellContainer.appendChild(contentText);
                cellContainer.appendChild(timeText);
                row.appendChild(cellContainer);
                recentDetectionsElement.appendChild(row);
            });
        } catch (e) {
            console.error("Fallo al pintar lista:", e);
        }
    });
}

function showDetection(result) {
    const display = feedbackContentElement;
    display.innerHTML = ''; // Limpiamos el cuadro

    // Buscamos la clase en el Diccionario. Si detecta algo raro que no configuraste, usa 'default'
    const config = classConfig[result] || classConfig["default"];

    const imgElement = document.createElement('img');
    imgElement.src = config.img;
    imgElement.alt = result;
    imgElement.style.width = '100px';

    const textElement = document.createElement('div');
    textElement.textContent = config.text;
    textElement.className = 'detection-text';
    textElement.style.marginTop = '10px';
    textElement.style.fontWeight = 'bold';

    display.appendChild(imgElement);
    display.appendChild(textElement);
}

// ==========================================
// CONTROL DEL BOTÓN DE MOTORES
// ==========================================
const motorBtn = document.getElementById('motorControlBtn');
let rutinaActiva = false;

motorBtn.addEventListener('click', () => {
    rutinaActiva = !rutinaActiva;
    actualizarBoton();
    
    // Le enviamos la orden a Python (true = iniciar, false = detener)
    socket.emit('toggle_routine', rutinaActiva);
});

function actualizarBoton() {
    if (rutinaActiva) {
        motorBtn.textContent = '🛑 Detener Rutina';
        motorBtn.style.backgroundColor = '#b00020'; // Rojo de alerta
    } else {
        motorBtn.textContent = '▶️ Iniciar Rutina';
        motorBtn.style.backgroundColor = '#008184'; // Verde Arduino
    }
}

// Escuchar cuando Python termine la secuencia por sí solo
socket.on('rutina_terminada', () => {
    rutinaActiva = false;
    actualizarBoton();
});