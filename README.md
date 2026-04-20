# UXIAPRO

UXIA Web – Asistente Inteligente de Exposiciones 🚗🤖
Descripción

UXIA Web es la versión web del proyecto UXIA, un asistente inteligente diseñado para mejorar la experiencia de los visitantes en exposiciones, especialmente en ferias del automóvil.

La aplicación permite explorar vehículos expuestos e identificarlos mediante inteligencia artificial a partir de una fotografía tomada por el visitante. Además, incluye un panel de administración para gestionar exposiciones y entrenar el sistema de reconocimiento.

El sistema está dividido en dos partes principales:

Frontend (Visitantes) 👀

Permite a los usuarios:

Explorar los elementos disponibles en las exposiciones.
Utilizar la función ITEM ID:
Subir una foto del coche que están viendo.
La IA identifica el modelo.
Devuelven una descripción detallada desde la base de datos del catálogo.

La identificación se realiza mediante un sistema de matching entre la imagen enviada y los modelos entrenados previamente.

Backend / Panel de Administración 🛠️

Permite a los administradores:

Crear y gestionar exposiciones.
Subir imágenes de vehículos para entrenar la IA.
Gestionar el catálogo de coches.
Etiquetar automáticamente exposiciones usando inteligencia artificial.
Administrar contenido del frontend.
Tipos de Usuario 👤

El sistema contempla tres roles principales:

Superusuario
Acceso al panel de administración de Django.
Gestión completa del sistema.
Creación de administradores de exposiciones.
Admin Expo

Puede:

Acceder al panel de administración del frontend.
Crear exposiciones.
Subir imágenes de coches.
Entrenar el sistema de reconocimiento IA.
Visitante

Puede:

Explorar exposiciones.
Consultar información de vehículos.
Utilizar la función ITEM ID para identificar coches mediante fotografía.
Recursos del Proyecto ☁️

Infraestructura utilizada:

Servidor web desplegado en IETI Cloud
Dominio: *.ieti.site
Servidor de IA basado en Ollama, alojado en los servidores del centro
Objetivo del Proyecto 🎯

Desarrollar un asistente inteligente capaz de mejorar la interacción entre visitantes y exposiciones, facilitando la identificación automática de vehículos mediante visión artificial e inteligencia artificial aplicada a catálogos digitales.
