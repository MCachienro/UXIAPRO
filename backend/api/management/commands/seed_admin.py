from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Expo

class Command(BaseCommand):
    help = 'Crea un admin y le asigna una expo'

    def handle(self, *args, **options):
        # 1. Crear el usuario administrador
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={'is_staff': True, 'is_superuser': True, 'first_name': 'Admin UXIA'}
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Usuario admin creado: admin / admin123'))
        else:
            self.stdout.write('El usuario admin ya existe.')

        # 2. Crear una Expo y asignársela a este admin
        expo, created = Expo.objects.get_or_create(
            nom="Expo Patrimoni IETI",
            defaults={'propietari': admin, 'descripcio': 'Exposició gestionada per l\'administrador'}
        )
        
        if not created:
            expo.propietari = admin
            expo.save()

        self.stdout.write(self.style.SUCCESS(f'Expo "{expo.nom}" vinculada al admin ID: {admin.id}'))