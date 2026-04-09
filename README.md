## 🌱 EcoRover Q
### Rover con Edge AI para monitoreo de áreas verdes

### 🚨 Problematica

Las ciudades enfrentan problemas como:

- Isla de calor urbana
- Contaminación
- Mantenimiento ineficiente de áreas verdes

Actualmente, el estado de las plantas se revisa de forma manual y tardía, lo que provoca:

- Desperdicio de agua
- Pérdida de vegetación


## 💡 Solución

EcoRover Q es un rover que monitorea plantas en tiempo real usando Inteligencia Artificial en el borde (Edge AI).

El sistema:

- 📷 Captura imágenes de hojas
- 🧠 Clasifica su estado en tiempo real
- 🌡️ Mide temperatura ambiental
- 🚗 Se desplaza de forma predefinida

Clasificación:

- 🌿 Hoja sana
- ⚠️ Hoja no sana
- 🟫 Background
  
## 🧠 Inteligencia Artificial
Plataforma: Edge Impulse


Modelo: MobileNetV2 (optimizado para embebidos)


Dataset propio: ~120 imágenes por clase


Ejecutado directamente en Arduino UNO Q

## Hardware

- Arduino UNO Q
- See3CAM
- Arduino MODULINO DISTANCE (vl53l4cd)
- Arduino MODULINO THERMO
- Chasis carrito aluminio
- 4 llantas omnidireccionales
- Power bank
- 4 motor DC
- 2 modulo puente H L298
- Porta pilas
- 2 baterías Litio recargables
- Cables dupont jumpers
- Trípode
- Cables de datos usb

## ¿Cómo funciona?
- El rover avanza en un ratu predefinida
- Captura imágenes de hojas
- El modelo de IA clasifica en tiempo real
- Se muestran resultados en la interfaz
- Se extraen datos de temperatura del medio ambiente

## Interfaz
- 📷 Vista en tiempo real (cámara)
- 🧠 Clasificación de la hoja
- 🌡️ Temperatura y humedad
- ▶️ Botón para iniciar ruta predefinida del rover









