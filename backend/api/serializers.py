# serializers.py
from rest_framework import serializers
from .models import Expo, Item, Imatge

class ImatgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Imatge
        fields = ['id', 'url_imatge', 'tipus']

class ItemSerializer(serializers.ModelSerializer):
    # Esto te permite ver la imagen dentro del ítem
    imatge_destacada = ImatgeSerializer(read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'nom', 'descripcio', 'imatge_destacada', "imatges"]

class ExpoSerializer(serializers.ModelSerializer):
    # Esto hace "la magia": incluye la lista de ítems dentro de la expo
    items = ItemSerializer(many=True, read_only=True)

    class Meta:
        model = Expo
        fields = ['id', 'nom', 'descripcio', 'estat', 'items', 'propietari']