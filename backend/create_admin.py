from django.contrib.auth.models import User
from django.core.management import execute_from_command_line
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Check if superuser exists
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@localhost', 'admin123456')
    print('Created superuser: admin / admin123456')
else:
    print('Superuser admin already exists')
