import os
import io
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files import File
from django.core.files.base import ContentFile
from api.models import Expo, Item, Imatge
from django.conf import settings
from faker import Faker
import random
from PIL import Image, ImageDraw


def build_placeholder_png(label: str) -> bytes:
    image = Image.new("RGB", (1280, 720), (58, 65, 79))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 540, 1280, 720), fill=(30, 35, 46))
    draw.text((60, 80), "Imagen demo no encontrada", fill=(245, 245, 245))
    draw.text((60, 140), label[:60], fill=(255, 222, 173))
    draw.text((60, 610), "UXIA - random seed placeholder", fill=(215, 215, 215))

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


ALLOWED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
MAX_RANDOM_IMAGES_PER_ITEM = 4


def get_demo_images(demo_dir: Path):
    if not demo_dir.exists() or not demo_dir.is_dir():
        return []

    return sorted(
        [
            file_path
            for file_path in demo_dir.iterdir()
            if file_path.is_file() and file_path.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS
        ]
    )

class Command(BaseCommand):
    help = "Genera una expo aleatoria con Faker"

    def handle(self, *args, **kwargs):
        fake = Faker("es_ES")

        # Generar nombre aleatorio
        ciudades = ["Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao"]
        sufijos = ["Car show", "Expo Motor", "Salón Automóvil"]
        nombre_expo = f"{random.choice(ciudades)} {random.choice(sufijos)}"

        expo = Expo.objects.create(nom=nombre_expo, descripcio=fake.text(max_nb_chars=220))

        demo_dir = Path(settings.BASE_DIR) / "media" / "demo"
        demo_images = get_demo_images(demo_dir)
        if demo_images:
            self.stdout.write(
                f"Se encontraron {len(demo_images)} imagenes en media/demo para random."
            )
        else:
            self.stdout.write(
                "No hay imagenes validas en media/demo, se usaran placeholders."
            )

        for _ in range(5):
            nombre_coche = f"{fake.company()} {fake.word().capitalize()}"
            item = Item.objects.create(
                expo=expo,
                nom=nombre_coche,
                descripcio=fake.paragraph(nb_sentences=3),
            )

            if demo_images:
                max_images = min(MAX_RANDOM_IMAGES_PER_ITEM, len(demo_images))
                image_count = random.randint(2, max_images) if max_images >= 2 else 1
                selected_images = random.sample(demo_images, image_count)

                featured = None
                for image_path in selected_images:
                    with open(image_path, "rb") as image_file:
                        created_image = Imatge.objects.create(
                            item=item,
                            url_imatge=File(image_file, name=image_path.name),
                            tipus=Imatge.Tipus.PUBLICA,
                            es_publica=True,
                        )
                    if featured is None:
                        featured = created_image

                item.imatge_destacada = featured
                item.save(update_fields=["imatge_destacada", "data_actualitzacio"])
                continue

            fallback_img = Imatge.objects.create(
                item=item,
                url_imatge=ContentFile(
                    build_placeholder_png(item.nom),
                    name=f"random_fallback_{item.id}.png",
                ),
                tipus=Imatge.Tipus.PUBLICA,
                es_publica=True,
            )
            item.imatge_destacada = fallback_img
            item.save(update_fields=["imatge_destacada", "data_actualitzacio"])
            self.stdout.write(
                f"Nota: Item {item.id} sin fotos demo, creado fallback."
            )

        self.stdout.write(self.style.SUCCESS(f"Expo {nombre_expo} generada con éxito."))