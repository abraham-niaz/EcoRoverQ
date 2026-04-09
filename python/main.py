from arduino.app_utils import App, Bridge
from arduino.app_bricks.web_ui import WebUI
from arduino.app_bricks.video_imageclassification import VideoImageClassification
from datetime import datetime, UTC
import json
import cv2
import time 
import threading # <-- Importante para ejecutar la secuencia en segundo plano

frozen = False
last_result = None

ui = WebUI()
detection_stream = VideoImageClassification(confidence=0.5, debounce_sec=0.0)

if hasattr(detection_stream, "cap"):
    detection_stream.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 176)
    detection_stream.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 144)
    detection_stream.cap.set(cv2.CAP_PROP_FPS, 5)

def send_detections_to_ui(classifications: dict):
    global frozen, last_result
    
    if hasattr(detection_stream, "cap"):
        for _ in range(3):
            detection_stream.cap.read()

    if frozen:
        if last_result is not None:
            ui.send_message("classifications", message=last_result)
        return
          
    if len(classifications) == 0:
        return
      
    entries = []
    for key, value in classifications.items():
        entry = {
            "content": key,
            "confidence": value,
            "timestamp": datetime.now(UTC).isoformat()
        }
        entries.append(entry)    
  
    if len(entries) > 0:
        msg = json.dumps(entries)
        last_result = msg
        ui.send_message("classifications", message=msg)

detection_stream.on_detect_all(send_detections_to_ui)

# ==========================================
# FUNCIÓN DE CLIMA (Se ejecuta constantemente)
# ==========================================
def leer_clima():
    try:
        clima_data = Bridge.call("obtener_clima")
        if clima_data:
            ui.send_message("clima_update", message=clima_data)
    except Exception:
        pass
    time.sleep(1)

# ==========================================
# SECUENCIA AUTÓNOMA CONTROLADA POR UI
# ==========================================
import threading

rutina_activa = False
hilo_motores = None

def enviar_comando(comando, duracion):
    """Envía la orden y permite interrumpir el tiempo de espera al instante"""
    global rutina_activa
    if not rutina_activa: return False # Si no está activa, abortamos

    try:
        print(f"Robot -> {comando} por {duracion}s")
        Bridge.call("mover_carro", comando)
    except Exception as e:
        print(f"Error motor: {e}")

    # En lugar de usar sleep(duracion) que bloquea todo, hacemos micro-pausas
    # para poder frenar instantáneamente si el usuario presiona "Detener"
    t_end = time.time() + duracion
    while time.time() < t_end:
        if not rutina_activa:
            Bridge.call("mover_carro", "STOP")
            return False
        time.sleep(0.05)
        
    return True

def secuencia_autonoma():
    global rutina_activa
    print("Iniciando secuencia de movimiento...")
    
    # Repetir exactamente 2 veces
    for _ in range(2):
        if not enviar_comando("ADELANTE", 1.5): break
        if not enviar_comando("STOP", 0.3): break
        if not enviar_comando("GIRO_DERECHA", 0.368): break
        if not enviar_comando("STOP", 2.0): break
        if not enviar_comando("GIRO_IZQUIERDA", 0.368): break
        if not enviar_comando("STOP", 0.3): break
        
    # Finalmente detenerse de forma segura y avisar a la web
    Bridge.call("mover_carro", "STOP")
    rutina_activa = False
    print("Secuencia finalizada.")
    ui.send_message("rutina_terminada", message="ok") # Esto regresa el botón a color verde

# Esta función la manda llamar app.js cuando haces clic en el botón
def handle_toggle_routine(sid, estado):
    global rutina_activa, hilo_motores
    if estado and not rutina_activa:
        rutina_activa = True
        hilo_motores = threading.Thread(target=secuencia_autonoma)
        hilo_motores.daemon = True
        hilo_motores.start()
    elif not estado and rutina_activa:
        rutina_activa = False # Esto rompe el bucle de los motores al instante

# Registramos el mensaje para que Python escuche al botón
ui.on_message("toggle_routine", handle_toggle_routine)


# ==========================================
# INICIO DEL SISTEMA
# ==========================================
# Ya no iniciamos el hilo de motores aquí, solo iniciamos el clima
App.run(user_loop=leer_clima)