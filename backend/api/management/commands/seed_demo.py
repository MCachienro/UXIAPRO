import base64
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from api.models import Expo, Imatge, Item


TINY_PNG_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8"
    "/w8AAn8B9W7w4wAAAABJRU5ErkJggg=="
)


class Command(BaseCommand):
    help = "Create temporary demo data for frontend testing."

    def add_arguments(self, parser):
        parser.add_argument("--expos", type=int, default=3, help="Number of demo expos")
        parser.add_argument(
            "--items-per-expo", type=int, default=4, help="Number of items per expo"
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previous demo records before creating new data",
        )

    def handle(self, *args, **options):
        demo_prefix = "[DEMO]"
        expos_count = max(1, options["expos"])
        items_per_expo = max(1, options["items_per_expo"])

        if options["reset"]:
            deleted = Expo.objects.filter(nom__startswith=demo_prefix).delete()
            self.stdout.write(self.style.WARNING(f"Reset demo data: {deleted[0]} records removed"))

        tiny_png = base64.b64decode(TINY_PNG_BASE64)

        created_expos = 0
        created_items = 0
        created_images = 0

        for expo_index in range(1, expos_count + 1):
            expo = Expo.objects.create(
                nom=f"{demo_prefix} Expo {expo_index}",
                descripcio=f"Expo de prova {expo_index} per validar frontend.",
                estat=Expo.Estat.DISPONIBLE,
            )
            created_expos += 1

            for item_index in range(1, items_per_expo + 1):
                item = Item.objects.create(
                    expo=expo,
                    nom=f"Demo Car {expo_index}-{item_index}",
                    descripcio="Item temporal per comprovar carrusel i detall superposat.",
                )
                created_items += 1

                first_image = Imatge.objects.create(
                    item=item,
                    url_imatge=ContentFile(
                        tiny_png,
                        name=f"demo_expo_{expo_index}_item_{item_index}_1.png",
                    ),
                    tipus=Imatge.Tipus.PUBLICA,
                    es_publica=True,
                )
                created_images += 1

                second_image = Imatge.objects.create(
                    item=item,
                    url_imatge=ContentFile(
                        tiny_png,
                        name=f"demo_expo_{expo_index}_item_{item_index}_2.png",
                    ),
                    tipus=Imatge.Tipus.PUBLICA,
                    es_publica=True,
                )
                created_images += 1

                item.imatge_destacada = first_image
                item.save(update_fields=["imatge_destacada"])

                self.stdout.write(
                    f"Created item {item.nom} with images {first_image.id} and {second_image.id}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo seed complete: expos={created_expos}, items={created_items}, images={created_images}"
            )
        )
