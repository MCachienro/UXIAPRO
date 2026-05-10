import os
import io
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.files import File
from django.core.files.base import ContentFile
from api.models import Expo, Item, Imatge
from django.conf import settings
from PIL import Image, ImageDraw

ALLOWED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
MAX_IMAGES_PER_CAR = 8

def build_placeholder_png(label: str) -> bytes:
    image = Image.new("RGB", (1280, 720), (27, 49, 73))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 540, 1280, 720), fill=(18, 33, 49))
    draw.text((60, 80), "Foto no disponible", fill=(245, 245, 245))
    draw.text((60, 140), label[:60], fill=(170, 220, 255))
    draw.text((60, 610), "UXIA - placeholder automatico", fill=(210, 210, 210))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()

class Command(BaseCommand):
    help = "Carga dinámicamente exposiciones IETI en múltiples idiomas (ES, CA, EN, FR)"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True, "is_active": True},
        )
        if admin_user.check_password("admin123") is False:
            admin_user.set_password("admin123")
            admin_user.save()

        # 1. Definición de Exposiciones
        exposiciones_config = [
            {"lenguaje": "ES", "desc": "Exposición oficial del centro IETI", "item_prefix": "Vehículo"},
            {"lenguaje": "CA", "desc": "Exposició oficial del centre IETI", "item_prefix": "Vehicle"},
            {"lenguaje": "EN", "desc": "Official exhibition of the IETI center", "item_prefix": "Vehicle"},
            {"lenguaje": "FR", "desc": "Exposition officielle du centre IETI", "item_prefix": "Véhicule"},
        ]

        ruta_base_fotos = os.path.join(settings.BASE_DIR, 'media', 'cotxes')
        if not os.path.exists(ruta_base_fotos):
            self.stderr.write(f"Error: Ruta {ruta_base_fotos} no encontrada.")
            return

        # 2. Escaneo de carpetas (Coches disponibles)
        carpetas_coches = sorted([
            d for d in os.listdir(ruta_base_fotos) 
            if os.path.isdir(os.path.join(ruta_base_fotos, d))
        ])

        for conf in exposiciones_config:
            # Crear/Obtener la Expo para este idioma
            nombre_expo_idioma = f"IETI CAR SHOW ({conf['lenguaje']})"
            expo, _ = Expo.objects.get_or_create(
                nom=nombre_expo_idioma,
                lenguaje=conf["lenguaje"],
                defaults={
                    "descripcio": conf["desc"],
                    "propietari": admin_user,
                }
            )

            # Limpiar items para regenerar
            Item.objects.filter(expo=expo).delete()
            self.stdout.write(self.style.SUCCESS(f"Procesando Expo: {conf['lenguaje']}"))

            for folder_name in carpetas_coches:
                ruta_coche = os.path.join(ruta_base_fotos, folder_name)
                nom_formateado = folder_name.replace('-', ' ')
                
                # Crear Item con descripción genérica en el idioma correspondiente
                item = Item.objects.create(
                    expo=expo,
                    nom=nom_formateado,
                    descripcio=f"{conf['item_prefix']} {nom_formateado}."
                )

                # Cargar imágenes de la carpeta
                imagenes = sorted([
                    f for f in os.listdir(ruta_coche)
                    if f.lower().endswith(ALLOWED_IMAGE_EXTENSIONS)
                ])

                if imagenes:
                    featured_img = None
                    # Limitamos y cargamos
                    for i, img_name in enumerate(imagenes[:MAX_IMAGES_PER_CAR]):
                        img_path = os.path.join(ruta_coche, img_name)
                        try:
                            with open(img_path, 'rb') as f:
                                django_file = File(f, name=img_name)
                                imatge_obj = Imatge.objects.create(
                                    item=item,
                                    url_imatge=django_file,
                                    tipus='PUBLICA',
                                    es_publica=True
                                )
                                if i == 0: # La primera es la destacada
                                    featured_img = imatge_obj
                        except Exception as e:
                            self.stderr.write(f"Error en {img_name}: {e}")

                    item.imatge_destacada = featured_img
                    item.save(update_fields=["imatge_destacada"])
                else:
                    # Fallback si no hay fotos
                    placeholder = build_placeholder_png(nom_formateado)
                    img_fallback = Imatge.objects.create(
                        item=item,
                        url_imatge=ContentFile(placeholder, name=f"fix_{folder_name}.png"),
                        tipus='PUBLICA',
                        es_publica=True
                    )
                    item.imatge_destacada = img_fallback
                    item.save()

                self.stdout.write(f"  ✓ {nom_formateado} añadido a expo {conf['lenguaje']}")

        self.stdout.write(self.style.SUCCESS("✓ Seeder multi-idioma completado automáticamente."))