import os
import io
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
    help = "Carga el set de datos real del IETI CAR SHOW"

    def _list_images(self, folder_path: str):
        if not os.path.isdir(folder_path):
            return []

        files = [
            filename
            for filename in os.listdir(folder_path)
            if os.path.isfile(os.path.join(folder_path, filename))
            and filename.lower().endswith(ALLOWED_IMAGE_EXTENSIONS)
        ]
        return sorted(files)

    def handle(self, *args, **kwargs):
        # 1. Crear Expo
        expo, created = Expo.objects.get_or_create(
            nom="IETI CAR SHOW",
            defaults={"descripcio": "Exposición oficial del centro IETI"}
        )
        ruta_base_fotos = os.path.join(settings.BASE_DIR, 'media', 'cotxes')

        if expo.descripcio != "Exposición oficial del centro IETI":
            expo.descripcio = "Exposición oficial del centro IETI"
            expo.save(update_fields=["descripcio", "data_actualitzacio"])

        # 2. Lista de coches reales (ajusta los nomres y paths)
        coches = [
            {
                "nom": "Chevrolet-Aveo",
                "carpeta": "Chevrolet-Aveo",
                "destacada": "IMG_5637.HEIC.jpg",
                "descripcio": "Utilitari compacte fiable, ideal per ciutat i trajectes del dia a dia.",
            },
            {
                "nom": "Ford-Focus",
                "carpeta": "Ford-Focus",
                "destacada": "Frente1.jpg",
                "descripcio": "Berlina equilibrada amb bon comportament dinamic i consum contingut.",
            },
            {
                "nom": "Opel-Insignia",
                "carpeta": "Opel-Insignia",
                "destacada": "WhatsApp Image 2026-04-16 at 17.51.10.jpeg",
                "descripcio": "Model gran orientat a confort, amb disseny sobri i equipament complet.",
            },
            {
                "nom": "Seat-Ibiza-2025",
                "carpeta": "Seat-Ibiza-2025",
                "destacada": "IMG_3982.HEIC.jpg",
                "descripcio": "Utility modern de nova generacio, agilit i enfocament juvenil.",
            },
            {
                "nom": "Seat-Leon",
                "carpeta": "Seat-Leon",
                "destacada": "IMG-20260417-WA0020.jpg",
                "descripcio": "Compacte esportiu molt versatil amb bona resposta i linees marcades.",
            },
            {
                "nom": "Seat-Leon-FR-2021",
                "carpeta": "Seat-Leon-FR-2021",
                "destacada": "ladoIzquierdo.jpg",
                "descripcio": "Versio FR amb acabat esportiu, orientada a una conduccio mes dinamica.",
            },
            {
                "nom": "Seat-Toledo",
                "carpeta": "Seat-Toledo",
                "destacada": "IMG-20260417-WA0042.jpg",
                "descripcio": "Berlina practica amb maleter ampli i enfocada a us familiar.",
            },
            {
                "nom": "Volkswagen",
                "carpeta": "Volkswagen",
                "destacada": "IMG_2766.HEIC.jpg",
                "descripcio": "Model d'estil clasic de la marca, amb acabats robusts i elegants.",
            },
        ]

        noms_catalog = {coche["nom"] for coche in coches}
        stale_items = Item.objects.filter(expo=expo).exclude(nom__in=noms_catalog)
        if stale_items.exists():
            stale_count = stale_items.count()
            stale_items.delete()
            self.stdout.write(f"Items fuera de catalogo eliminados: {stale_count}")

        for coche in coches:
            item, _ = Item.objects.update_or_create(
                expo=expo,
                nom=coche["nom"],
                defaults={"descripcio": coche["descripcio"]},
            )

            # Limpiar imágenes previas para regenerar destacada + secundarias.
            item.imatges.all().delete()
            item.imatge_destacada = None
            item.save(update_fields=["imatge_destacada", "data_actualitzacio"])

            ruta_carpeta = os.path.join(ruta_base_fotos, coche["carpeta"])
            all_images = self._list_images(ruta_carpeta)

            if all_images:
                ordered_images = []
                if coche["destacada"] in all_images:
                    ordered_images.append(coche["destacada"])
                ordered_images.extend(
                    filename for filename in all_images if filename != coche["destacada"]
                )
                ordered_images = ordered_images[:MAX_IMAGES_PER_CAR]

                featured = None
                for image_name in ordered_images:
                    image_path = os.path.join(ruta_carpeta, image_name)
                    with open(image_path, "rb") as image_file:
                        img = Imatge.objects.create(
                            item=item,
                            url_imatge=File(image_file, name=image_name),
                            tipus=Imatge.Tipus.PUBLICA,
                            es_publica=True,
                        )
                    if featured is None:
                        featured = img

                item.imatge_destacada = featured
                item.save(update_fields=["imatge_destacada", "data_actualitzacio"])
                self.stdout.write(
                    f"Actualizado: {coche['nom']} ({len(ordered_images)} imagenes publicas)"
                )
                continue

            # Si no hay carpeta o imágenes físicas, crear fallback visible.
            missing_folder = os.path.join(coche["carpeta"], coche["destacada"])
            self.stderr.write(
                f"No hay imagenes en {ruta_carpeta}. Se creara fallback para {coche['nom']}."
            )

            try:
                fallback_img = Imatge.objects.create(
                    item=item,
                    url_imatge=ContentFile(
                        build_placeholder_png(coche["nom"]),
                        name=f"ieti_fallback_{coche['nom']}.png",
                    ),
                    tipus=Imatge.Tipus.PUBLICA,
                    es_publica=True,
                )
                item.imatge_destacada = fallback_img
                item.save()
                self.stderr.write(
                    f"No se encontró la foto: {missing_folder}. Se creó imagen fallback."
                )
            except Exception as error:
                self.stderr.write(f"Error creando fallback para {coche['nom']}: {error}")