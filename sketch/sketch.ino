// SPDX-FileCopyrightText: Copyright (C) ARDUINO SRL (http://www.arduino.cc)
// SPDX-License-Identifier: MPL-2.0

#include "Arduino_RouterBridge.h"
#include <Modulino.h>

// --- CLIMA ---
ModulinoThermo thermo;

// --- DEFINICIÓN DE PINES (8 SALIDAS) ---
// Módulo 1: Lado Izquierdo
const int IN1_DEL_IZQ = 2; 
const int IN2_DEL_IZQ = 3; 
const int IN3_TRAS_IZQ = 4; 
const int IN4_TRAS_IZQ = 5; 

// Módulo 2: Lado Derecho
const int IN1_DEL_DER = 6; 
const int IN2_DEL_DER = 7; 
const int IN3_TRAS_DER = 8; 
const int IN4_TRAS_DER = 9; 

void setup() {
  // Inicializamos la placa Modulino y el sensor
  Modulino.begin();
  thermo.begin();

  // Configuración de pines de los motores
  pinMode(IN1_DEL_IZQ, OUTPUT); pinMode(IN2_DEL_IZQ, OUTPUT);
  pinMode(IN3_TRAS_IZQ, OUTPUT); pinMode(IN4_TRAS_IZQ, OUTPUT);
  pinMode(IN1_DEL_DER, OUTPUT); pinMode(IN2_DEL_DER, OUTPUT);
  pinMode(IN3_TRAS_DER, OUTPUT); pinMode(IN4_TRAS_DER, OUTPUT);
  
  detenerse(); // Nos aseguramos de que inicie quieto

  // Iniciamos el Bridge
  Bridge.begin();
  
  // Exponemos ambas funciones a Python
  Bridge.provide("obtener_clima", pedir_clima);
  Bridge.provide("mover_carro", comando_movimiento);
}

void loop() {
  // El Bridge trabaja en segundo plano
}

// --- FUNCIÓN DE CLIMA ---
String pedir_clima() {
  float temp = thermo.getTemperature();
  float hum = thermo.getHumidity();
  return "{\"temp\":" + String(temp) + ", \"hum\":" + String(hum) + "}";
}

// --- FUNCIÓN DE MOTORES ---
void comando_movimiento(String direccion) {
  if (direccion == "ADELANTE") {
    avanzar();
  } else if (direccion == "ATRAS") {
    regresar();
  } else if (direccion == "DERECHA") {
    desplazarLateralDerecha();
  } else if (direccion == "IZQUIERDA") {
    desplazarLateralIzquierda();
  } else if (direccion == "GIRO_IZQUIERDA") {
    girarIzquierda();
  } else if (direccion == "GIRO_DERECHA") {
    girarDerecha();
  } else if (direccion == "STOP") {
    detenerse();
  }
}

// --- FUNCIONES DE MOVIMIENTO (MAGIA MECANUM) ---
void moverMotor(int pin1, int pin2, int estado1, int estado2) {
  digitalWrite(pin1, estado1);
  digitalWrite(pin2, estado2);
}

void avanzar() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, LOW, HIGH);
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, LOW, HIGH);
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, LOW, HIGH);
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, LOW, HIGH);
}

void regresar() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, HIGH, LOW);
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, HIGH, LOW);
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, HIGH, LOW);
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, HIGH, LOW);
}

void detenerse() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, LOW, LOW);
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, LOW, LOW);
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, LOW, LOW);
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, LOW, LOW);
}

void desplazarLateralIzquierda() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, HIGH, LOW);
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, LOW, HIGH);
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, LOW, HIGH);
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, HIGH, LOW);
}

void desplazarLateralDerecha() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, LOW, HIGH);
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, HIGH, LOW);
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, HIGH, LOW);
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, LOW, HIGH);
}

void girarIzquierda() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, LOW, HIGH);   
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, HIGH, LOW); 
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, LOW, HIGH);   
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, HIGH, LOW); 
}

void girarDerecha() {
  moverMotor(IN1_DEL_IZQ, IN2_DEL_IZQ, HIGH, LOW);   
  moverMotor(IN3_TRAS_IZQ, IN4_TRAS_IZQ, LOW, HIGH); 
  moverMotor(IN1_DEL_DER, IN2_DEL_DER, HIGH, LOW);   
  moverMotor(IN3_TRAS_DER, IN4_TRAS_DER, LOW, HIGH); 
}