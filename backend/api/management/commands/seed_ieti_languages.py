import os
import io
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.files import File
from django.core.files.base import ContentFile
from api.models import Expo, Item, Imatge
from django.conf import settings
from PIL import Image, ImageDraw
import pillow_heif

# Registrar HEIF con PIL para poder abrir archivos HEIF
pillow_heif.register_heif_opener()

ALLOWED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
MAX_IMAGES_PER_CAR = 8

CAR_DESCRIPTIONS = {
    "Chevrolet-Aveo": {
        "ES": "Chevrolet Aveo, un turismo compacto y práctico para uso urbano.",
        "CA": "Chevrolet Aveo, un turisme compacte i pràctic per a ús urbà.",
        "EN": "Chevrolet Aveo, a compact and practical car for city driving.",
        "FR": "Chevrolet Aveo, une voiture compacte et pratique pour la ville.",
    },
    "Citroen-Berlingo": {
        "ES": "Citroën Berlingo, un vehículo familiar versátil con gran capacidad de carga.",
        "CA": "Citroën Berlingo, un vehicle familiar versàtil amb gran capacitat de càrrega.",
        "EN": "Citroën Berlingo, a versatile family vehicle with excellent cargo space.",
        "FR": "Citroën Berlingo, un véhicule familial polyvalent avec un grand volume de chargement.",
    },
    "Dacia": {
        "ES": "Dacia Sandero, un coche económico y fiable para el día a día.",
        "CA": "Dacia Sandero, un cotxe econòmic i fiable per al dia a dia.",
        "EN": "Dacia Sandero, an affordable and reliable car for everyday use.",
        "FR": "Dacia Sandero, une voiture abordable et fiable pour un usage quotidien.",
    },
    "Ford-Focus": {
        "ES": "Ford Focus, una berlina compacta equilibrada entre confort y eficiencia.",
        "CA": "Ford Focus, una berlina compacta equilibrada entre confort i eficiència.",
        "EN": "Ford Focus, a compact hatchback balancing comfort and efficiency.",
        "FR": "Ford Focus, une compacte équilibrée entre confort et efficacité.",
    },
    "Nissan-Interstar": {
        "ES": "Nissan Interstar, una furgoneta amplia pensada para transporte profesional.",
        "CA": "Nissan Interstar, una furgoneta àmplia pensada per al transport professional.",
        "EN": "Nissan Interstar, a spacious van designed for professional transport.",
        "FR": "Nissan Interstar, un fourgon spacieux conçu pour le transport professionnel.",
    },
    "Opel-Insignia": {
        "ES": "Opel Insignia, una berlina elegante orientada al confort en carretera.",
        "CA": "Opel Insignia, una berlina elegant orientada al confort a la carretera.",
        "EN": "Opel Insignia, an elegant sedan focused on road comfort.",
        "FR": "Opel Insignia, une berline élégante pensée pour le confort routier.",
    },
    "Seat-Ibiza-2025": {
        "ES": "SEAT Ibiza 2025, un utilitario moderno, ágil y eficiente.",
        "CA": "SEAT Ibiza 2025, un utilitari modern, àgil i eficient.",
        "EN": "SEAT Ibiza 2025, a modern, agile and efficient hatchback.",
        "FR": "SEAT Ibiza 2025, une citadine moderne, agile et efficace.",
    },
    "Seat-Leon": {
        "ES": "SEAT León, un compacto deportivo con buen equilibrio entre diseño y prestaciones.",
        "CA": "SEAT León, un compacte esportiu amb bon equilibri entre disseny i prestacions.",
        "EN": "SEAT Leon, a sporty compact car balancing design and performance.",
        "FR": "SEAT Leon, une compacte sportive qui équilibre design et performances.",
    },
    "Seat-Leon-FR-2021": {
        "ES": "SEAT León FR 2021, una versión deportiva con un diseño más agresivo.",
        "CA": "SEAT León FR 2021, una versió esportiva amb un disseny més agressiu.",
        "EN": "SEAT Leon FR 2021, a sportier version with a more aggressive design.",
        "FR": "SEAT Leon FR 2021, une version sportive au design plus agressif.",
    },
    "Seat-Toledo": {
        "ES": "SEAT Toledo, una berlina práctica con buen espacio interior.",
        "CA": "SEAT Toledo, una berlina pràctica amb bon espai interior.",
        "EN": "SEAT Toledo, a practical sedan with plenty of interior space.",
        "FR": "SEAT Toledo, une berline pratique offrant un bel espace intérieur.",
    },
    "Volkswagen": {
        "ES": "Volkswagen, un turismo compacto de líneas sobrias y uso cotidiano.",
        "CA": "Volkswagen, un turisme compacte de línies sòbries i ús quotidià.",
        "EN": "Volkswagen, a compact car with clean lines and everyday usability.",
        "FR": "Volkswagen, une voiture compacte aux lignes sobres pensée pour le quotidien.",
    },
}


def build_item_description(folder_name: str, language: str, display_name: str) -> str:
    car_metadata = CAR_DESCRIPTIONS.get(folder_name, {})
    if language in car_metadata:
        return car_metadata[language]

    fallback_templates = {
        "ES": "{name}, un vehículo de la exposición IETI.",
        "CA": "{name}, un vehicle de l'exposició IETI.",
        "EN": "{name}, a vehicle featured in the IETI exhibition.",
        "FR": "{name}, un véhicule présenté dans l'exposition IETI.",
    }
    return fallback_templates.get(language, "{name}").format(name=display_name)

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
            nombre_expo_idioma = f"{conf['lenguaje']} - IETI CAR SHOW"
            expo, _ = Expo.objects.get_or_create(
                nom=nombre_expo_idioma,
                lenguaje=conf["lenguaje"],
                defaults={
                    "descripcio": conf["desc"],
                    "propietari": admin_user,
                }
            )

            # Borrar archivos antiguos antes de regenerar, para no agotar cuota en el servidor.
            imagenes_antiguas = Imatge.objects.filter(item__expo=expo)
            for imatge in imagenes_antiguas:
                if imatge.url_imatge:
                    try:
                        imatge.url_imatge.delete(save=False)
                    except Exception as e:
                        self.stderr.write(f"Error eliminando archivo antiguo {imatge.id}: {e}")

            # Limpiar items para regenerar
            Item.objects.filter(expo=expo).delete()
            self.stdout.write(self.style.SUCCESS(f"Procesando Expo: {conf['lenguaje']}"))

            for folder_name in carpetas_coches:
                ruta_coche = os.path.join(ruta_base_fotos, folder_name)
                nom_formateado = folder_name.replace('-', ' ')

                if folder_name == "Citroen-Berlingo":
                    nom_formateado = "Citroën Berlingo"
                elif folder_name == "Seat-Leon":
                    nom_formateado = "SEAT León"
                elif folder_name == "Seat-Leon-FR-2021":
                    nom_formateado = "SEAT León FR 2021"
                elif folder_name == "Seat-Ibiza-2025":
                    nom_formateado = "SEAT Ibiza 2025"
                
                # Crear Item con descripción genérica en el idioma correspondiente
                item = Item.objects.create(
                    expo=expo,
                    nom=nom_formateado,
                    descripcio=build_item_description(folder_name, conf["lenguaje"], nom_formateado)
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
                            # Intentar convertir HEIF a JPEG si es necesario
                            if img_name.lower().endswith(('.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp')):
                                img = Image.open(img_path)
                                
                                # Convertir a RGB (maneja RGBA, paleta, etc.)
                                if img.mode in ('RGBA', 'P', 'LA', '1'):
                                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                                    if img.mode in ('RGBA', 'LA'):
                                        rgb_img.paste(img, mask=img.split()[-1])
                                    else:
                                        rgb_img.paste(img)
                                else:
                                    rgb_img = img.convert('RGB') if img.mode != 'RGB' else img
                                
                                buffer = io.BytesIO()
                                rgb_img.save(buffer, format='JPEG', quality=95)
                                buffer.seek(0)
                                
                                # Si es HEIF/HEIC, cambiar extensión a .jpg
                                final_name = img_name.rsplit('.', 1)[0] + '.jpg' if img_name.lower().endswith(('.heic', '.heif')) else img_name
                                
                                django_file = File(buffer, name=final_name)
                                imatge_obj = Imatge.objects.create(
                                    item=item,
                                    url_imatge=django_file,
                                    tipus='PUBLICA',
                                    es_publica=True
                                )
                                if i == 0:  # La primera es la destacada
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