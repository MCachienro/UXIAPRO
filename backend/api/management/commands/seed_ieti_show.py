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
    help = "Carga dinámicamente los coches desde la carpeta media/cotxes"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True, "is_active": True},
        )
        if admin_user.check_password("admin123") is False: # Seguretat bàsica per al password
            admin_user.set_password("admin123")
            admin_user.save()

        # 1. Obtenir o crear Expo
        expo, _ = Expo.objects.get_or_create(
            nom="IETI CAR SHOW",
            defaults={
                "descripcio": "Exposición oficial del centro IETI",
                "lenguaje": "ES",
                "propietari": admin_user,
            }
        )

        # 2. Neteja total d'items per regenerar-ho tot
        Item.objects.filter(expo=expo).delete()
        self.stdout.write(self.style.SUCCESS("Neteja completada. Escanejant carpetes..."))

        ruta_base_fotos = os.path.join(settings.BASE_DIR, 'media', 'cotxes')
        
        if not os.path.exists(ruta_base_fotos):
            self.stderr.write(f"Error: La ruta {ruta_base_fotos} no existeix.")
            return

        # 3. Iterar sobre les carpetes dins de media/cotxes
        for folder_name in sorted(os.listdir(ruta_base_fotos)):
            ruta_carpeta = os.path.join(ruta_base_fotos, folder_name)
            
            if not os.path.isdir(ruta_carpeta):
                continue

            # Creem el nom del cotxe a partir de la carpeta (ex: "Seat-Leon" -> "Seat Leon")
            nom_cotxe = folder_name.replace('-', ' ')
            
            item = Item.objects.create(
                expo=expo,
                nom=nom_cotxe,
                descripcio=f"Vehicle model {nom_cotxe} disponible a l'exposició."
            )

            # Llistar imatges de la carpeta
            imatges_disponibles = sorted([
                f for f in os.listdir(ruta_carpeta)
                if f.lower().endswith(ALLOWED_IMAGE_EXTENSIONS)
            ])[:MAX_IMAGES_PER_CAR]

            if imatges_disponibles:
                featured = None
                for i, img_name in enumerate(imatges_disponibles):
                    img_path = os.path.join(ruta_carpeta, img_name)
                    
                    # Convertir imagen a JPEG si es HEIF
                    try:
                        img = Image.open(img_path)
                        # Convertir a RGB (elimina alfa y paleta)
                        if img.mode in ('RGBA', 'P', 'LA', '1'):
                            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                            if img.mode in ('RGBA', 'LA'):
                                rgb_img.paste(img, mask=img.split()[-1])
                            else:
                                rgb_img.paste(img)
                        else:
                            rgb_img = img.convert('RGB') if img.mode != 'RGB' else img
                        
                        # Guardar como JPEG en memoria
                        buffer = io.BytesIO()
                        rgb_img.save(buffer, format='JPEG', quality=95)
                        buffer.seek(0)
                        
                        # Cambiar extensión a .jpg si es necesario
                        final_name = img_name.rsplit('.', 1)[0] + '.jpg' if img_name.lower().endswith(('.heic', '.heif')) else img_name
                        
                        nova_img = Imatge.objects.create(
                            item=item,
                            url_imatge=File(buffer, name=final_name),
                            tipus=Imatge.Tipus.PUBLICA,
                            es_publica=True,
                        )
                        if i == 0: # La primera imatge de la llista serà la destacada
                            featured = nova_img
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f"  Error procesando {img_name}: {e}"))
                        continue
                
                item.imatge_destacada = featured
                item.save()
                self.stdout.write(f"Afegit: {nom_cotxe} amb {len(imatges_disponibles)} imatges.")
            
            else:
                # Fallback si la carpeta està buida
                content = build_placeholder_png(nom_cotxe)
                fallback = Imatge.objects.create(
                    item=item,
                    url_imatge=ContentFile(content, name=f"fallback_{folder_name}.png"),
                    tipus=Imatge.Tipus.PUBLICA,
                    es_publica=True,
                )
                item.imatge_destacada = fallback
                item.save()
                self.stdout.write(self.style.WARNING(f"Afegit: {nom_cotxe} (SENSE FOTOS, creat fallback)"))