from django.db import models
from django.contrib.auth.models import User

class Etiqueta(models.Model):
    nom = models.CharField(max_length=50, unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='fills')

    def __str__(self):
        return self.nom

class Expo(models.Model):
    class Estat(models.TextChoices):
        INIT = 'INIT', 'Inicial'
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        ACTUALITZABLE = 'ACTUALITZABLE', 'Actualitzable'

    nom = models.CharField(max_length=100)
    descripcio = models.TextField(blank=True, null=True)
    estat = models.CharField(max_length=20, choices=Estat.choices, default=Estat.INIT)
    data_creacio = models.DateTimeField(auto_now_add=True)
    data_actualitzacio = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

class Item(models.Model):
    expo = models.ForeignKey(Expo, on_delete=models.CASCADE, related_name='items')
    nom = models.CharField(max_length=100)
    descripcio = models.TextField(blank=True, null=True)
    imatge_destacada = models.ForeignKey('Imatge', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    etiquetes = models.ManyToManyField(Etiqueta, blank=True)
    data_creacio = models.DateTimeField(auto_now_add=True)
    data_actualitzacio = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

class Imatge(models.Model):
    class Tipus(models.TextChoices):
        PUBLICA = 'PUBLICA', 'Pública'
        PRIVADA = 'PRIVADA', 'Privada'

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='imatges')
    url_imatge = models.ImageField(upload_to='imatges/')
    tipus = models.CharField(max_length=10, choices=Tipus.choices, default=Tipus.PUBLICA)
    es_publica = models.BooleanField(default=True) # Campo del sprint 1, act 2
    data_pujada = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Imatge de {self.item.nom}"

class Intent(models.Model):
    usuari = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    expo = models.ForeignKey(Expo, on_delete=models.CASCADE)
    url_foto_enviada = models.ImageField(upload_to='intents/')
    resultat_identificacio = models.TextField(blank=True, null=True)
    item_identificat = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True) # Campo del sprint 1, act 2
    data_intent = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Intent a {self.expo.nom} el {self.data_intent}"

