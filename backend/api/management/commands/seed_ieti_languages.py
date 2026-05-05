"""
Seeder para cargar exposiciones IETI en múltiples idiomas.
Crea versiones de la exposición en ES, CA, EN y FR.
"""
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
    help = "Carga exposiciones IETI en múltiples idiomas (ES, CA, EN, FR)"

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
        User = get_user_model()
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True, "is_active": True},
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save(update_fields=["password"])
            self.stdout.write("Usuario admin creado: admin / admin123")

        # Definir exposiciones en múltiples idiomas
        exposiciones = [
            {
                "nom": "IETI CAR SHOW",
                "lenguaje": "ES",
                "descripcio": "Exposición oficial del centro IETI"
            },
            {
                "nom": "IETI CAR SHOW",
                "lenguaje": "CA",
                "descripcio": "Exposició oficial del centre IETI"
            },
            {
                "nom": "IETI CAR SHOW",
                "lenguaje": "EN",
                "descripcio": "Official exhibition of the IETI center"
            },
            {
                "nom": "IETI CAR SHOW",
                "lenguaje": "FR",
                "descripcio": "Exposition officielle du centre IETI"
            },
        ]

        ruta_base_fotos = os.path.join(settings.BASE_DIR, 'media', 'cotxes')

        # Especificaciones de coches
        coches = [
            {
                "nom": "Chevrolet-Aveo",
                "carpeta": "Chevrolet-Aveo",
                "destacada": "IMG_5637.HEIC.jpg",
                "descripcio_es": "Utilitari compacte fiable, ideal per ciutat i trajectes del dia a dia.",
                "descripcio_ca": "Utilitari compacte fiable, ideal per ciutat i trajectes del dia a dia.",
                "descripcio_en": "Reliable compact utility, ideal for city and daily commutes.",
                "descripcio_fr": "Utilitaire compact fiable, idéal pour la ville et les trajets quotidiens.",
            },
            {
                "nom": "Ford-Focus",
                "carpeta": "Ford-Focus",
                "destacada": "Frente1.jpg",
                "descripcio_es": "Berlina equilibrada amb bon comportament dinamic i consum contingut.",
                "descripcio_ca": "Berlina equilibrada amb bon comportament dinamic i consum contingut.",
                "descripcio_en": "Balanced sedan with good dynamic performance and reasonable consumption.",
                "descripcio_fr": "Berline équilibrée avec bon comportement dynamique et consommation maîtrisée.",
            },
            {
                "nom": "Opel-Insignia",
                "carpeta": "Opel-Insignia",
                "destacada": "WhatsApp Image 2026-04-16 at 17.51.10.jpeg",
                "descripcio_es": "Model gran orientat a confort, amb disseny sobri i equipament complet.",
                "descripcio_ca": "Model gran orientat a confort, amb disseny sobri i equipament complet.",
                "descripcio_en": "Large model focused on comfort, with sober design and complete equipment.",
                "descripcio_fr": "Grand modèle orienté confort, avec design sobre et équipement complet.",
            },
            {
                "nom": "Seat-Ibiza-2025",
                "carpeta": "Seat-Ibiza-2025",
                "destacada": "IMG_3982.HEIC.jpg",
                "descripcio_es": "Utility modern de nova generacio, agilit i enfocament juvenil.",
                "descripcio_ca": "Utility modern de nova generacio, agilit i enfocament juvenil.",
                "descripcio_en": "Modern new generation utility, agile and youth-focused.",
                "descripcio_fr": "Utilitaire moderne de nouvelle génération, agile et orienté jeunesse.",
            },
            {
                "nom": "Seat-Leon",
                "carpeta": "Seat-Leon",
                "destacada": "IMG-20260417-WA0020.jpg",
                "descripcio_es": "Compacte esportiu molt versatil amb bona resposta i linees marcades.",
                "descripcio_ca": "Compacte esportiu molt versatil amb bona resposta i linees marcades.",
                "descripcio_en": "Very versatile sport compact with good response and marked lines.",
                "descripcio_fr": "Compact sportif très polyvalent avec bonne réactivité et lignes marquées.",
            },
            {
                "nom": "Seat-Leon-FR-2021",
                "carpeta": "Seat-Leon-FR-2021",
                "destacada": "ladoIzquierdo.jpg",
                "descripcio_es": "Versio FR amb acabat esportiu, orientada a una conduccio mes dinamica.",
                "descripcio_ca": "Versio FR amb acabat esportiu, orientada a una conduccio mes dinamica.",
                "descripcio_en": "FR version with sporty finish, oriented towards more dynamic driving.",
                "descripcio_fr": "Version FR avec finition sportive, orientée vers une conduite plus dynamique.",
            },
            {
                "nom": "Seat-Toledo",
                "carpeta": "Seat-Toledo",
                "destacada": "IMG-20260417-WA0042.jpg",
                "descripcio_es": "Berlina practica amb maleter ampli i enfocada a us familiar.",
                "descripcio_ca": "Berlina practica amb maleter ampli i enfocada a us familiar.",
                "descripcio_en": "Practical sedan with spacious trunk and focused on family use.",
                "descripcio_fr": "Berline pratique avec grand coffre et orientée vers un usage familial.",
            },
            {
                "nom": "Volkswagen",
                "carpeta": "Volkswagen",
                "destacada": "IMG_2766.HEIC.jpg",
                "descripcio_es": "Model d'estil clasic de la marca, amb acabats robusts i elegants.",
                "descripcio_ca": "Model d'estil clasic de la marca, amb acabats robusts i elegants.",
                "descripcio_en": "Classic style model from the brand, with robust and elegant finishes.",
                "descripcio_fr": "Modèle de style classique de la marque, avec finitions robustes et élégantes.",
            },
        ]

        # Crear exposiciones en cada idioma
        for expo_data in exposiciones:
            expo, created = Expo.objects.get_or_create(
                nom=expo_data["nom"],
                lenguaje=expo_data["lenguaje"],
                defaults={
                    "descripcio": expo_data["descripcio"],
                    "propietari": admin_user,
                }
            )

            # Limpiar items existentes para esta expo
            Item.objects.filter(expo=expo).delete()
            self.stdout.write(f"Preparada expo: {expo_data['nom']} ({expo_data['lenguaje']})")

            # Seleccionar descripción según idioma
            idioma_key = f"descripcio_{expo_data['lenguaje'].lower()}"

            # Crear items
            for coche in coches:
                item = Item.objects.create(
                    expo=expo,
                    nom=coche["nom"],
                    descripcio=coche.get(idioma_key, coche["descripcio_es"])
                )

                # Cargar imágenes
                ruta_coche = os.path.join(ruta_base_fotos, coche["carpeta"])
                imagenes = self._list_images(ruta_coche)

                # Crear destacada primero
                destacada_path = os.path.join(ruta_coche, coche["destacada"])
                if os.path.isfile(destacada_path):
                    with open(destacada_path, 'rb') as f:
                        imatge_destacada = Imatge.objects.create(
                            item=item,
                            url_imatge=File(f, name=coche["destacada"]),
                            tipus='PUBLICA',
                            es_publica=True
                        )
                        item.imatge_destacada = imatge_destacada
                        item.save(update_fields=["imatge_destacada"])

                # Cargar resto de imágenes
                count = 0
                for img_filename in imagenes:
                    if count >= MAX_IMAGES_PER_CAR:
                        break
                    if img_filename == coche["destacada"]:
                        continue

                    img_path = os.path.join(ruta_coche, img_filename)
                    if os.path.isfile(img_path):
                        try:
                            with open(img_path, 'rb') as f:
                                Imatge.objects.create(
                                    item=item,
                                    url_imatge=File(f, name=img_filename),
                                    tipus='PUBLICA',
                                    es_publica=True
                                )
                            count += 1
                        except Exception as e:
                            self.stderr.write(f"Error cargando {img_filename}: {str(e)}")
                            # Usar placeholder si falla
                            placeholder_data = build_placeholder_png(f"{coche['nom']} - {img_filename}")
                            Imatge.objects.create(
                                item=item,
                                url_imatge=ContentFile(placeholder_data, name=f"{img_filename}.png"),
                                tipus='PUBLICA',
                                es_publica=True
                            )

                self.stdout.write(f"  ✓ Item creado: {coche['nom']} ({count} imágenes)")

        self.stdout.write(self.style.SUCCESS("✓ Seeder completado: Exposiciones IETI en 4 idiomas cargadas"))
