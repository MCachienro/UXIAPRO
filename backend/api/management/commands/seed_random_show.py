import os
from django.core.management.base import BaseCommand
from django.core.files import File
from api.models import Expo, Item, Imatge
from django.conf import settings
from faker import Faker
import random

class Command(BaseCommand):
    help = "Genera una expo aleatoria con Faker"

    def handle(self, *args, **kwargs):
        fake = Faker("es_ES")

        # Generar nombre aleatorio
        ciudades = ["Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao"]
        sufijos = ["Car show", "Expo Motor", "Salón Automóvil"]
        nombre_expo = f"{random.choice(ciudades)} {random.choice(sufijos)}"

        expo = Expo.objects.create(nom=nombre_expo, descripcio=fake.text())

        # Pool de fotos simuladas (asegurar tenerlas en media/demo/)
        fotos_demo = ["coche1.jpg", "coche2.jpg", "coche3.jpg", "coche4.jpg", "coche5.jpg", "coche6.jpg", "coche7.jpg",]

        for _ in range(5):
            nombre_coche = f"{fake.company()} {fake.word().capitalize()}"
            item = Item.objects.create(expo=expo, nom=nombre_coche)

            # Crear una imagen aleatoria
            foto_elegida = random.choice(fotos_demo)
            es_publica = random.choice([True, False]) # Mezcla de tipo

            try:
                with open(f"media/demo/{foto_elegida}", "rb") as f:
                    img = Imatge.objects.create(
                        item=item,
                        url_imatge=File(f, name=foto_elegida),
                        tipus=Imatge.Tipus.PUBLICA if es_publica else Imatge.Tipus.PRIVADA,
                        es_publica=es_publica
                    )
                    item.imatge_destacada = img
                    item.save()
            except:
                self.stdout.write("Nota: Archivo de demo no encontrado, saltando imagen.")

        self.stdout.write(self.style.SUCCESS(f"Expo {nombre_expo} generada con éxito."))