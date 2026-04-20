import os
from django.core.management.base import BaseCommand
from django.core.files import File
from api.models import Expo, Item, Imatge
from django.conf import settings

class Command(BaseCommand):
    help = "Carga el set de datos real del IETI CAR SHOW"

    def handle(self, *args, **kwargs):
        # 1. Crear Expo
        expo, created = Expo.objects.get_or_create(
            nom="IETI CAR SHOW",
            defaults={"descripcio": "Exposición oficial del centro IETI"}
        )
        ruta_base_fotos = os.path.join(settings.BASE_DIR, 'media', 'cotxes')

        # 2. Lista de coches reales (ajusta los nomres y paths)
        coches = [
            {"nom": "Chevrolet-Aveo", "path": "Chevrolet-Aveo/IMG_5637.HEIC.jpg"},
            {"nom": "Ford-Focus", "path": "Ford-Focus/Frente1.jpg"},
            {"nom": "Open-Insignia", "path": "Opel-Insignia/WhatsApp Image 2026-04-16 at 17.51.10.jpeg"},
            {"nom": "Seat-Ibiza-2025", "path": "Seat-Ibiza-2025/IMG_3982.HEIC.jpg"},
            {"nom": "Seat-Leon", "path": "Seat-Leon/IMG-20260417-WA0020.jpg"},
            {"nom": "Seat-Leon-FR-2021", "path": "Seat-Leon-FR-2021/ladoIzquierdo.jpg"},
            {"nom": "Seat-Toledo", "path": "Seat-Toledo/IMG-20260417-WA0042.jpg"},
            {"nom": "Volkswagen", "path": "Volkswagen/IMG_2766.HEIC.jpg"},
        ]

        for coche in coches:
            # Crear Item
            item = Item.objects.create(expo=expo, nom=coche["nom"])
            ruta_completa = os.path.join(ruta_base_fotos, coche["path"])

            # Crear Imagen (Asumimos que existe la foto en media/cotxes/)
            try:
                with open(ruta_completa, "rb") as f:
                    img = Imatge.objects.create(
                        item=item,
                        url_imatge=File(f, name=os.path.basename(ruta_completa)),
                        tipus=Imatge.Tipus.PUBLICA,
                        es_publica=True
                    )

                # Asignar destacada
                item.imatge_destacada = img
                item.save()
                self.stdout.write(f"Creado: {coche['nom']}")
            except FileNotFoundError:
                self.stderr.write(f"No se encontró la foto: {coche["path"]}")