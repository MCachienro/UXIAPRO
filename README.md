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

## Backend: entorno y dependencias

Desde la raiz del proyecto:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

Ejecutar migraciones y servidor:

```bash
cd backend
../venv/bin/python manage.py migrate
../venv/bin/python manage.py runserver
```

## API Sprint 1 - Actividad 2 (curl)

Base URL local:

```bash
http://127.0.0.1:8000/api
```

1. Listar exposiciones

```bash
curl -s http://127.0.0.1:8000/api/expos | jq
```

2. Obtener detalle de una exposicion

```bash
curl -s http://127.0.0.1:8000/api/expos/1 | jq
```

3. Listar items de una exposicion

```bash
curl -s http://127.0.0.1:8000/api/expos/1/items | jq
```

4. Obtener detalle de un item

```bash
curl -s http://127.0.0.1:8000/api/items/1 | jq
```

Nota: si no tienes jq instalado, puedes quitar el pipe | jq y veras el JSON en una sola linea.
